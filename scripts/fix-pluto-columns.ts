import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not set');
  }

  const sql = postgres(process.env.POSTGRES_URL, { max: 1 });

  const alters: string[] = [
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "areasource" TYPE varchar(5);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "ext" TYPE varchar(5);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "proxcode" TYPE varchar(5);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "irrlotcode" TYPE varchar(10);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lottype" TYPE varchar(5);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bsmtcode" TYPE varchar(5);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "ownertype" TYPE varchar(5);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "zmcode" TYPE varchar(10);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "plutomapid" TYPE varchar(10);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "borocode" TYPE varchar(5);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bldgclass" TYPE varchar(5);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "landuse" TYPE varchar(5);',
    'ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "appdate" TYPE varchar(30);',
    // Ensure zoning columns exist for UI/tools that reference them
    'ALTER TABLE "NYCMapPLUTO" ADD COLUMN IF NOT EXISTS zonedist1 varchar(12);',
    'ALTER TABLE "NYCMapPLUTO" ADD COLUMN IF NOT EXISTS zonedist2 varchar(12);',
    'ALTER TABLE "NYCMapPLUTO" ADD COLUMN IF NOT EXISTS zonedist3 varchar(12);',
    'ALTER TABLE "NYCMapPLUTO" ADD COLUMN IF NOT EXISTS zonedist4 varchar(12);',
  ];

  try {
    for (const stmt of alters) {
      await sql.unsafe(stmt);
    }
    console.log('✅ NYCMapPLUTO column widths updated');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('❌ Failed to update NYCMapPLUTO columns:', err);
  process.exit(1);
});
