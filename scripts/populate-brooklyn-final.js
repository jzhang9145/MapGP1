const postgres = require('postgres');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

async function populateBrooklynCensus() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
  if (!CENSUS_API_KEY || CENSUS_API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('CENSUS_API_KEY environment variable is not set');
  }

  const client = postgres(process.env.POSTGRES_URL);

  try {
    console.log('🚀 Starting Brooklyn census population...');
    
    // Clear existing data
    console.log('🧹 Clearing existing census blocks...');
    await client`DELETE FROM "NYCCensusBlocks"`;
    
    // Fetch data directly using the working URL
    console.log('📊 Fetching Brooklyn census tract data...');
    const url = `https://api.census.gov/data/2023/acs/acs5?get=B01003_001E,B19013_001E,B25002_001E,B25002_002E&for=tract:*&in=state:36%20county:047&key=${CENSUS_API_KEY}`;
    
    console.log('📡 Making API call...');
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const rawText = await response.text();
    console.log('📄 Response received, length:', rawText.length);
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.log('❌ JSON parse error. Raw response preview:', rawText.substring(0, 500));
      throw parseError;
    }
    
    console.log(`✅ Parsed ${data.length - 1} census tracts successfully`);
    
    // Process the data
    const headers = data[0];
    const rows = data.slice(1);
    
    console.log('📋 Headers:', headers);
    console.log('📋 Sample row:', rows[0]);
    
    let processed = 0;
    const limit = 200; // Process first 200 tracts
    
    for (let i = 0; i < Math.min(rows.length, limit); i++) {
      const row = rows[i];
      
      try {
        const state = row[headers.indexOf('state')];
        const county = row[headers.indexOf('county')];
        const tract = row[headers.indexOf('tract')];
        const geoid = `${state}${county}${tract}000`;
        
        const population = Number.parseInt(row[headers.indexOf('B01003_001E')]) || null;
        const income = Number.parseInt(row[headers.indexOf('B19013_001E')]) || null;
        const households = Number.parseInt(row[headers.indexOf('B25002_001E')]) || null;
        const occupied = Number.parseInt(row[headers.indexOf('B25002_002E')]) || null;
        
        // Skip if no population data
        if (!population) continue;
        
        // Create geometry based on tract number
        const tractNum = Number.parseInt(tract);
        const gridSize = 20; // 20x20 grid
        const row_idx = Math.floor(tractNum / 10000) % gridSize;
        const col_idx = Math.floor((tractNum % 10000) / 100) % gridSize;
        
        // Brooklyn approximate bounds
        const minLat = 40.57;
        const maxLat = 40.74;
        const minLng = -74.05;
        const maxLng = -73.83;
        
        const cellHeight = (maxLat - minLat) / gridSize;
        const cellWidth = (maxLng - minLng) / gridSize;
        
        const startLat = minLat + (row_idx * cellHeight);
        const startLng = minLng + (col_idx * cellWidth);
        
        const geometry = {
          type: 'Polygon',
          coordinates: [[
            [startLng, startLat],
            [startLng + cellWidth, startLat],
            [startLng + cellWidth, startLat + cellHeight],
            [startLng, startLat + cellHeight],
            [startLng, startLat]
          ]]
        };
        
        // Insert GeoJSON
        const geoResult = await client`
          INSERT INTO "GeoJSONData" (data, metadata)
          VALUES (${JSON.stringify(geometry)}, ${JSON.stringify({ 
            source: 'US Census Bureau ACS 2023', 
            type: 'tract',
            tract: tract
          })})
          RETURNING id
        `;
        
        // Insert census data
        await client`
          INSERT INTO "NYCCensusBlocks" (
            geoid, state, county, tract, block,
            "totalPopulation", "totalHouseholds", "occupiedHouseholds",
            "medianHouseholdIncome", borough, "geojsonDataId"
          )
          VALUES (
            ${geoid}, ${state}, ${county}, ${tract}, '000',
            ${population}, ${households}, ${occupied},
            ${income}, 'Brooklyn', ${geoResult[0].id}
          )
        `;
        
        processed++;
        
        if (processed % 25 === 0) {
          console.log(`📈 Processed ${processed} tracts...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing tract ${row[headers.indexOf('tract')]}:`, error.message);
      }
    }
    
    // Final check
    const result = await client`SELECT COUNT(*) FROM "NYCCensusBlocks"`;
    console.log(`✅ Successfully populated ${result[0].count} Brooklyn census tracts`);
    
    // Show sample
    const sample = await client`
      SELECT geoid, "totalPopulation", "medianHouseholdIncome" 
      FROM "NYCCensusBlocks" 
      ORDER BY "totalPopulation" DESC
      LIMIT 5
    `;
    
    console.log('📊 Top 5 by population:');
    sample.forEach(row => {
      console.log(`  - GEOID: ${row.geoid}, Pop: ${row.totalPopulation}, Income: $${row.medianHouseholdIncome || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
populateBrooklynCensus()
  .then(() => {
    console.log('🎉 Brooklyn census population completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Population failed:', error.message);
    process.exit(1);
  });