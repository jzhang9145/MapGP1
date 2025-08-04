import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { nycNeighborhoods, geojsonData } from '../lib/db/schema';

// Database connection
const client = postgres(
  process.env.POSTGRES_URL ||
    'postgres://nestio:nestio123@localhost:5432/nestio',
);
const db = drizzle(client);

async function testGeometry() {
  try {
    console.log('Testing geometry data storage in GeoJSONData table...\n');

    // Get a few neighborhoods and check their geometry
    const neighborhoods = await db.select().from(nycNeighborhoods).limit(3);

    console.log(`Found ${neighborhoods.length} neighborhoods to test\n`);

    for (const neighborhood of neighborhoods) {
      console.log(`${neighborhood.name} (${neighborhood.borough})`);
      console.log(`   Has geojsonDataId: ${!!neighborhood.geojsonDataId}`);

      if (neighborhood.geojsonDataId) {
        // Get the geometry data from GeoJSONData table
        const geoData = await db
          .select()
          .from(geojsonData)
          .where(eq(geojsonData.id, neighborhood.geojsonDataId));

        if (geoData?.[0]) {
          console.log(`   Geometry type: ${geoData[0].data?.type}`);
          if (geoData[0].data?.type === 'Polygon') {
            console.log(
              `   Polygon coordinates: ${geoData[0].data.coordinates[0].length} points`,
            );
          } else if (geoData[0].data?.type === 'MultiPolygon') {
            console.log(
              `   MultiPolygon: ${geoData[0].data.coordinates.length} polygons`,
            );
          }
          console.log(`   Metadata: ${JSON.stringify(geoData[0].metadata)}`);
        } else {
          console.log(
            `   No geometry data found for ID: ${neighborhood.geojsonDataId}`,
          );
        }
      } else {
        console.log(`   No geojsonDataId found`);
      }
      console.log('');
    }

    console.log('✅ Geometry data test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the test
if (require.main === module) {
  testGeometry()
    .then(() => {
      console.log('Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testGeometry };
