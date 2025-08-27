import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not set');
  }
  const sql = postgres(process.env.POSTGRES_URL, { max: 1 });
  try {
    const rows = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM "NYCMapPLUTO"
    `;
    const count = rows[0]?.count ?? 0;
    console.log(count);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
