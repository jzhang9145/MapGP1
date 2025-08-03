const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// This script migrates existing geojson data from the Area table to the new GeoJSONData table
// Run this after applying the database migration

async function migrateGeoJSONData() {
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('Starting GeoJSON data migration...');

    // Get all areas with geojson data (if any exist in the old format)
    const areas = await client`
      SELECT "chatId", "name", "summary", "geojson", "createdAt", "updatedAt"
      FROM "Area"
      WHERE "geojson" IS NOT NULL
    `;

    console.log(`Found ${areas.length} areas with geojson data to migrate`);

    for (const area of areas) {
      try {
        // Create GeoJSONData record
        const metadata = {
          type: area.geojson?.type || 'unknown',
          size: JSON.stringify(area.geojson).length,
          migratedFrom: 'legacy_area_table',
          migratedAt: new Date().toISOString(),
        };

        const [geojsonDataRecord] = await client`
          INSERT INTO "GeoJSONData" ("id", "data", "metadata", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${JSON.stringify(area.geojson)}, ${JSON.stringify(metadata)}, ${area.createdAt}, ${area.updatedAt})
          RETURNING "id"
        `;

        // Update Area record to reference GeoJSONData
        await client`
          UPDATE "Area"
          SET "geojsonDataId" = ${geojsonDataRecord.id}
          WHERE "chatId" = ${area.chatId}
        `;

        console.log(`Migrated area: ${area.name} (${area.chatId})`);
      } catch (error) {
        console.error(`Failed to migrate area ${area.chatId}:`, error);
      }
    }

    console.log('GeoJSON data migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateGeoJSONData()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateGeoJSONData };
