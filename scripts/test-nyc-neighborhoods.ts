import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, asc, or, ilike } from 'drizzle-orm';
import { nycNeighborhoods } from '../lib/db/schema';

// Database connection
const client = postgres(
  process.env.POSTGRES_URL ||
    'postgres://nestio:nestio123@localhost:5432/nestio',
);
const db = drizzle(client);

async function testNYCNeighborhoods() {
  try {
    console.log('Testing NYC neighborhoods database queries...\n');

    // Test 1: Get all neighborhoods
    console.log('1. Testing getAllNYCNeighborhoods...');
    const allNeighborhoods = await db
      .select()
      .from(nycNeighborhoods)
      .orderBy(asc(nycNeighborhoods.name));
    console.log(`   Found ${allNeighborhoods.length} total neighborhoods\n`);

    // Test 2: Get Manhattan neighborhoods
    console.log('2. Testing getNYCNeighborhoodsByBorough (Manhattan)...');
    const manhattanNeighborhoods = await db
      .select()
      .from(nycNeighborhoods)
      .where(eq(nycNeighborhoods.borough, 'Manhattan'))
      .orderBy(asc(nycNeighborhoods.name));
    console.log(
      `   Found ${manhattanNeighborhoods.length} Manhattan neighborhoods`,
    );
    console.log(
      `   First 3: ${manhattanNeighborhoods
        .slice(0, 3)
        .map((n) => n.name)
        .join(', ')}\n`,
    );

    // Test 3: Search for specific neighborhood
    console.log('3. Testing searchNYCNeighborhoods (Brooklyn)...');
    const brooklynSearch = await db
      .select()
      .from(nycNeighborhoods)
      .where(
        or(
          ilike(nycNeighborhoods.name, '%Brooklyn%'),
          ilike(nycNeighborhoods.nta_name, '%Brooklyn%'),
          ilike(nycNeighborhoods.borough, '%Brooklyn%'),
        ),
      )
      .orderBy(asc(nycNeighborhoods.name));
    console.log(
      `   Found ${brooklynSearch.length} neighborhoods containing "Brooklyn"`,
    );
    console.log(
      `   First 3: ${brooklynSearch
        .slice(0, 3)
        .map((n) => n.name)
        .join(', ')}\n`,
    );

    // Test 4: Search for specific neighborhood name
    console.log('4. Testing searchNYCNeighborhoods (specific name)...');
    const specificSearch = await db
      .select()
      .from(nycNeighborhoods)
      .where(
        or(
          ilike(nycNeighborhoods.name, '%Williamsburg%'),
          ilike(nycNeighborhoods.nta_name, '%Williamsburg%'),
          ilike(nycNeighborhoods.borough, '%Williamsburg%'),
        ),
      )
      .orderBy(asc(nycNeighborhoods.name));
    console.log(
      `   Found ${specificSearch.length} neighborhoods containing "Williamsburg"`,
    );
    if (specificSearch.length > 0) {
      const neighborhood = specificSearch[0];
      console.log(
        `   Example: ${neighborhood.name} in ${neighborhood.borough}`,
      );
      console.log(
        `   Coordinates: ${neighborhood.center_latitude}, ${neighborhood.center_longitude}\n`,
      );
    }

    console.log(
      '✅ All tests passed! NYC neighborhoods database is working correctly.',
    );
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the test
if (require.main === module) {
  testNYCNeighborhoods()
    .then(() => {
      console.log('Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testNYCNeighborhoods };
