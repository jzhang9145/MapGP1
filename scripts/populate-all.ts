import { config } from 'dotenv';
import { spawn } from 'child_process';
import postgres from 'postgres';

config({ path: '.env.local' });

function run(cmd: string, args: string[], opts: { cwd?: string } = {}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function verifyDbConnection() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not set in .env.local');
  }
  const sql = postgres(process.env.POSTGRES_URL, { max: 1 });
  try {
    await sql`select 1`;
  } finally {
    await sql.end();
  }
}

async function main() {
  console.log('🚀 Starting unified database population');

  await verifyDbConnection();

  // Ensure DB schema is migrated
  console.log('⏳ Running migrations...');
  await run('pnpm', ['db:migrate']);

  // Neighborhoods
  console.log('\n🏙️ Populating NYC neighborhoods...');
  await run('npx', ['tsx', 'scripts/populate-nyc-neighborhoods.ts']);

  // Parks
  console.log('\n🌳 Populating NYC parks...');
  await run('npx', ['tsx', 'scripts/populate-nyc-parks.ts']);

  // School zones
  console.log('\n🏫 Populating NYC school zones...');
  await run('npx', ['tsx', 'scripts/populate-nyc-school-zones.ts']);

  // PLUTO column fixes (idempotent)
  console.log('\n🧩 Ensuring PLUTO column widths...');
  await run('npx', ['tsx', 'scripts/fix-pluto-columns.ts']);

  // PLUTO properties with geometry
  console.log('\n🗺️ Populating MapPLUTO properties with boundaries...');
  await run('node', ['scripts/populate-mappluto-with-geojson.js']);

  // Census blocks + ACS (optional)
  if (process.env.CENSUS_API_KEY && process.env.CENSUS_API_KEY.trim()) {
    console.log('\n📊 Populating NYC census blocks + ACS demographics...');
    await run('npx', ['tsx', 'scripts/populate-nyc-census-blocks.ts']);
  } else {
    console.log('\n⚠️ Skipping census blocks; CENSUS_API_KEY not set.');
  }

  console.log('\n✅ Unified population completed.');
}

main().catch((err) => {
  console.error('❌ Unified population failed:', err);
  process.exit(1);
});
