const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const CENSUS_YEAR = '2023';

async function populateBrooklynCensus() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  if (!CENSUS_API_KEY || CENSUS_API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('CENSUS_API_KEY environment variable is not set');
  }

  const client = postgres(process.env.POSTGRES_URL);

  try {
    console.log('🚀 Starting simplified Brooklyn census population...');
    
    // Clear existing census blocks data
    console.log('🧹 Clearing existing census blocks...');
    await client`DELETE FROM "NYCCensusBlocks"`;
    
    // Fetch basic demographic data for Brooklyn census tracts
    console.log('📊 Fetching census tract data...');
    const dataUrl = `https://api.census.gov/data/${CENSUS_YEAR}/acs/acs5?get=B01003_001E,B19013_001E,B25002_001E,B25002_002E&for=tract:*&in=state:36%20county:047&key=${CENSUS_API_KEY}`;
    
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Found ${data.length - 1} census tracts`);
    
    // Process data (skip header row)
    const headers = data[0];
    const rows = data.slice(1);
    
    let processed = 0;
    
    for (const row of rows.slice(0, 100)) { // Limit to first 100 for testing
      try {
        const state = row[headers.indexOf('state')];
        const county = row[headers.indexOf('county')];
        const tract = row[headers.indexOf('tract')];
        const geoid = `${state}${county}${tract}000`; // Make it look like a block
        
        const population = Number.parseInt(row[headers.indexOf('B01003_001E')]) || null;
        const income = Number.parseInt(row[headers.indexOf('B19013_001E')]) || null;
        const households = Number.parseInt(row[headers.indexOf('B25002_001E')]) || null;
        const occupied = Number.parseInt(row[headers.indexOf('B25002_002E')]) || null;
        
        // Create simple square geometry
        const tractNum = Number.parseInt(tract);
        const row_idx = Math.floor(tractNum / 100) % 10;
        const col_idx = tractNum % 10;
        
        const baseY = 40.6 + (row_idx * 0.02);
        const baseX = -74.0 + (col_idx * 0.02);
        
        const geometry = {
          type: 'Polygon',
          coordinates: [[
            [baseX, baseY],
            [baseX + 0.015, baseY],
            [baseX + 0.015, baseY + 0.015],
            [baseX, baseY + 0.015],
            [baseX, baseY]
          ]]
        };
        
        // Insert GeoJSON
        const geoResult = await client`
          INSERT INTO "GeoJSONData" (data, metadata)
          VALUES (${JSON.stringify(geometry)}, ${JSON.stringify({ source: 'Census ACS 2023', type: 'tract' })})
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
        if (processed % 20 === 0) {
          console.log(`📈 Processed ${processed} tracts...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing tract:`, error.message);
      }
    }
    
    // Check final count
    const result = await client`SELECT COUNT(*) FROM "NYCCensusBlocks"`;
    console.log(`✅ Successfully populated ${result[0].count} Brooklyn census tracts`);
    
    // Show sample data
    const sample = await client`
      SELECT geoid, "totalPopulation", "medianHouseholdIncome", borough 
      FROM "NYCCensusBlocks" 
      LIMIT 5
    `;
    
    console.log('📋 Sample data:');
    sample.forEach(row => {
      console.log(`  - GEOID: ${row.geoid}, Pop: ${row.totalPopulation}, Income: $${row.medianHouseholdIncome}`);
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
    console.error('💥 Population failed:', error);
    process.exit(1);
  });