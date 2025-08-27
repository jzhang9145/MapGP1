import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { nycSchoolZones, geojsonData } from '../lib/db/schema';

// Database connection
const client = postgres(
  process.env.POSTGRES_URL ||
    'postgres://nestio:nestio123@localhost:5432/nestio',
);
const db = drizzle(client);

interface NYCSchoolZoneApiData {
  type: 'Feature';
  geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    dbn: string;
    shape_area: string;
    initials: string;
    zoned_dist: string;
    creat_date: string;
    edit_date: string;
    x_centroid: string;
    y_centroid: string;
    boro_num: string;
    label: string;
    schooldist: string;
    esid_no: string;
    shape_leng: string;
    boro: string;
    remarks?: string;
  };
}

interface SchoolZoneApiResponse {
  type: 'FeatureCollection';
  features: NYCSchoolZoneApiData[];
}

async function getSchoolNameFromDbn(dbn: string, label: string): Promise<string | null> {
  // Extract school name from label or use DBN-based lookup
  // For now, we'll derive from the label field
  if (label && label !== dbn) {
    // Clean up the label to extract school names
    const schoolName = label.replace(/\(\w+\)/g, '').trim();
    if (schoolName && schoolName !== dbn) {
      return schoolName;
    }
  }
  
  // If we can't extract from label, return null for now
  // In a real implementation, you might want to maintain a separate lookup table
  return null;
}

async function populateNYCSchoolZones() {
  try {
    console.log('Fetching NYC elementary school zone data from API...');

    // Fetch data from NYC Open Data API
    const response = await fetch(
      'https://data.cityofnewyork.us/resource/cmjf-yawu.geojson',
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SchoolZoneApiResponse = await response.json();
    console.log(`Received ${data.features.length} school zones from API`);

    // Clear existing data
    console.log('Clearing existing school zone data...');
    await db.delete(nycSchoolZones);

    // Process and insert data
    console.log('Processing and inserting school zone data...');
    let insertedCount = 0;

    for (const feature of data.features) {
      try {
        const props = feature.properties;
        
        // Skip entries without a DBN (parks, cemeteries, etc.)
        if (!props.dbn) {
          console.log(`Skipping entry without DBN: ${props.label || 'Unknown'}`);
          continue;
        }
        
        // Get school name from DBN/label
        const schoolName = await getSchoolNameFromDbn(props.dbn, props.label);

        // Store geometry data in GeoJSONData table first
        let geojsonDataId: string | null = null;
        if (feature.geometry) {
          try {
            const geoData = await db
              .insert(geojsonData)
              .values({
                data: feature.geometry,
                metadata: {
                  type: 'nyc_school_zone_boundary',
                  dbn: props.dbn,
                  school_name: schoolName,
                  borough: props.boro,
                  district: props.schooldist,
                  source: 'NYC Department of Education',
                  shape_area: props.shape_area,
                  shape_length: props.shape_leng,
                },
              })
              .returning();
            geojsonDataId = geoData[0]?.id || null;
          } catch (error) {
            console.warn(
              `Failed to store geometry for school zone ${props.dbn}:`,
              error,
            );
          }
        }

        // Insert school zone data
        await db.insert(nycSchoolZones).values({
          dbn: props.dbn,
          schoolName: schoolName,
          schoolDistrict: props.schooldist || '0',
          borough: props.boro || 'U', // U for Unknown if missing
          boroNum: props.boro_num || '0',
          label: props.label,
          initials: props.initials,
          zonedDist: props.zoned_dist,
          esidNo: props.esid_no,
          shapeArea: props.shape_area,
          shapeLength: props.shape_leng,
          xCentroid: props.x_centroid ? Number.parseFloat(props.x_centroid) : null,
          yCentroid: props.y_centroid ? Number.parseFloat(props.y_centroid) : null,
          remarks: props.remarks || null,
          createDate: props.creat_date ? new Date(props.creat_date) : null,
          editDate: props.edit_date ? new Date(props.edit_date) : null,
          geojsonDataId: geojsonDataId,
        });

        insertedCount++;
        if (insertedCount % 10 === 0) {
          console.log(`Inserted ${insertedCount} school zones...`);
        }
      } catch (error) {
        console.error(`Error processing school zone ${feature.properties.dbn}:`, error);
      }
    }

    console.log(`Successfully populated ${insertedCount} NYC elementary school zones`);

    // Verify the data
    const count = await db.select().from(nycSchoolZones);
    console.log(`Database now contains ${count.length} school zones`);

    // Show some sample data
    console.log('\nSample school zones:');
    const samples = count.slice(0, 5);
    samples.forEach(zone => {
      console.log(`- ${zone.dbn}: ${zone.schoolName || zone.label} (District ${zone.schoolDistrict}, Borough ${zone.borough})`);
    });

  } catch (error) {
    console.error('Error populating NYC school zones:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  populateNYCSchoolZones()
    .then(() => {
      console.log('NYC school zones population completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('NYC school zones population failed:', error);
      process.exit(1);
    });
}

export { populateNYCSchoolZones };