import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { nycNeighborhoods } from '../lib/db/schema';

// Database connection
const client = postgres(
  process.env.POSTGRES_URL ||
    'postgres://nestio:nestio123@localhost:5432/nestio',
);
const db = drizzle(client);

interface NYCApiItem {
  ntaname: string;
  boroname: string;
  nta2020: string;
  cdta2020: string;
  cdtaname: string;
  the_geom?: {
    coordinates: number[][][] | number[][][][];
  };
  shape_area?: string;
  shape_leng?: string;
}

async function calculateCenterPoint(
  coordinates: number[][][] | number[][][][] | undefined,
): Promise<{ latitude: number; longitude: number }> {
  if (!coordinates || !Array.isArray(coordinates)) {
    return { latitude: 0, longitude: 0 };
  }

  // Handle different geometry types
  let points: number[][] = [];

  if (coordinates[0] && Array.isArray(coordinates[0])) {
    // MultiPolygon or Polygon
    if (Array.isArray(coordinates[0][0])) {
      // MultiPolygon
      coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          points.push(...ring);
        });
      });
    } else {
      // Polygon
      coordinates.forEach((ring) => {
        points.push(...ring);
      });
    }
  } else {
    // Single point or line
    points = coordinates as number[][];
  }

  if (points.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  // Calculate centroid
  const sumLng = points.reduce((sum, point) => sum + point[0], 0);
  const sumLat = points.reduce((sum, point) => sum + point[1], 0);

  return {
    latitude: sumLat / points.length,
    longitude: sumLng / points.length,
  };
}

async function populateNYCNeighborhoods() {
  try {
    console.log('Fetching NYC neighborhood data from API...');

    // Fetch data from NYC Open Data API
    const response = await fetch(
      'https://data.cityofnewyork.us/resource/9nt8-h7nd.json',
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NYCApiItem[] = await response.json();
    console.log(`Received ${data.length} neighborhoods from API`);

    // Clear existing data
    console.log('Clearing existing neighborhood data...');
    await db.delete(nycNeighborhoods);

    // Process and insert data
    console.log('Processing and inserting neighborhood data...');
    let insertedCount = 0;

    for (const item of data) {
      try {
        // Calculate center point from geometry
        const center = await calculateCenterPoint(item.the_geom?.coordinates);

        // Insert neighborhood data
        await db.insert(nycNeighborhoods).values({
          name: item.ntaname || 'Unknown',
          borough: item.boroname || 'Unknown',
          nta_code: item.nta2020 || 'Unknown',
          nta_name: item.ntaname || 'Unknown',
          nta_2020: item.nta2020 || 'Unknown',
          cdtca: item.cdta2020 || 'Unknown',
          cdtca_name: item.cdtaname || 'Unknown',
          center_latitude: center.latitude,
          center_longitude: center.longitude,
          shape_area: item.shape_area || null,
          shape_leng: item.shape_leng || null,
          geojsonDataId: null, // Will be populated separately if needed
        });

        insertedCount++;
        if (insertedCount % 10 === 0) {
          console.log(`Inserted ${insertedCount} neighborhoods...`);
        }
      } catch (error) {
        console.error(`Error processing neighborhood ${item.ntaname}:`, error);
      }
    }

    console.log(`Successfully populated ${insertedCount} NYC neighborhoods`);

    // Verify the data
    const count = await db.select().from(nycNeighborhoods);
    console.log(`Database now contains ${count.length} neighborhoods`);
  } catch (error) {
    console.error('Error populating NYC neighborhoods:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  populateNYCNeighborhoods()
    .then(() => {
      console.log('NYC neighborhoods population completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to populate NYC neighborhoods:', error);
      process.exit(1);
    });
}

export { populateNYCNeighborhoods };
