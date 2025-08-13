import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { count } from 'drizzle-orm';
import { nycParks, geojsonData } from '../lib/db/schema';

// Database connection
const client = postgres(
  process.env.POSTGRES_URL ||
    'postgres://nestio:nestio123@localhost:5432/nestio',
);
const db = drizzle(client);

interface NYCParkApiData {
  type: 'Feature';
  geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    gispropnum: string;
    name: string;
    signname: string;
    borough: string;
    borocode: string;
    communityboard: string;
    councildistrict: string;
    policepreinct: string;
    assemblydistrict: string;
    congressionaldistrict: string;
    senatedist: string;
    zipcode: string;
    address: string;
    acreage: string;
    typecategory: string;
    landuse: string;
    department: string;
    jurisdiction: string;
    retired: string;
    waterfront: string;
    [key: string]: any; // For any additional properties
  };
}

interface ParkApiResponse {
  type: 'FeatureCollection';
  features: NYCParkApiData[];
}

async function fetchNYCParksData(): Promise<ParkApiResponse> {
  console.log('Fetching NYC parks data from API...');
  const response = await fetch('https://data.cityofnewyork.us/resource/enfh-gkve.geojson');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch parks data: ${response.statusText}`);
  }
  
  return response.json();
}

async function clearExistingData() {
  console.log('Clearing existing parks data...');
  await db.delete(nycParks);
}

async function populateParks() {
  try {
    const parksData = await fetchNYCParksData();
    console.log(`Received ${parksData.features.length} parks from API`);

    await clearExistingData();

    console.log('Processing and inserting parks data...');
    let processedCount = 0;

    for (const feature of parksData.features) {
      try {
        const props = feature.properties;
        
        // Skip entries without essential data
        if (!props.name && !props.signname) {
          console.log(`Skipping entry without name: ${props.gispropnum || 'Unknown'}`);
          continue;
        }

        // Create GeoJSON data entry
        const [geoJsonRecord] = await db
          .insert(geojsonData)
          .values({
            data: feature,
            metadata: {
              type: 'nyc_park',
              source: 'NYC Open Data',
              gispropnum: props.gispropnum,
              name: props.name || props.signname,
            },
          })
          .returning();

        // Helper function to safely truncate strings
        const safeSubstring = (value: any, maxLength: number): string | null => {
          if (value === null || value === undefined) return null;
          const stringValue = String(value);
          return stringValue.substring(0, maxLength);
        };

        // Create parks entry with proper string length handling
        await db.insert(nycParks).values({
          gispropnum: safeSubstring(props.gispropnum, 50),
          name: safeSubstring(props.name, 255),
          signname: safeSubstring(props.signname, 255),
          borough: safeSubstring(props.borough, 50),
          borocode: safeSubstring(props.borocode, 2),
          communityboard: safeSubstring(props.communityboard, 10),
          councildistrict: safeSubstring(props.councildistrict, 10),
          policepreinct: safeSubstring(props.policepreinct, 10),
          assemblydistrict: safeSubstring(props.assemblydistrict, 10),
          congressionaldistrict: safeSubstring(props.congressionaldistrict, 10),
          senateDistrict: safeSubstring(props.senatedist, 10),
          zipcode: safeSubstring(props.zipcode, 20),
          address: safeSubstring(props.address, 500),
          acreage: safeSubstring(props.acreage, 20),
          typecategory: safeSubstring(props.typecategory, 100),
          landuse: safeSubstring(props.landuse, 100),
          department: safeSubstring(props.department, 100),
          jurisdiction: safeSubstring(props.jurisdiction, 100),
          retired: safeSubstring(props.retired, 10),
          waterfront: safeSubstring(props.waterfront, 10),
          geojsonDataId: geoJsonRecord.id,
        });

        processedCount++;
        
        if (processedCount % 100 === 0) {
          console.log(`Inserted ${processedCount} parks...`);
        }
      } catch (error) {
        console.error(`Error processing park ${feature.properties.name || feature.properties.gispropnum}:`, error);
        continue;
      }
    }

    console.log(`Successfully populated ${processedCount} NYC parks`);

    // Verify the data was inserted
    const totalParks = await db
      .select({ count: count() })
      .from(nycParks);
    
    console.log(`Database now contains ${totalParks[0].count} parks`);
    console.log('NYC parks population completed successfully');

  } catch (error) {
    console.error('Failed to populate NYC parks:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the population script
populateParks();