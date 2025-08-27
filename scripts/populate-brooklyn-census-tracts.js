const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const CENSUS_YEAR = '2023';
const KINGS_COUNTY_FIPS = '047'; // Brooklyn = Kings County
const NY_STATE_FIPS = '36';

// ACS 2023 variables for demographic data
const ACS_VARIABLES = [
  'B01003_001E', // Total population
  'B25002_001E', // Total households  
  'B25002_002E', // Occupied households
  'B25002_003E', // Vacant households
  'B19013_001E', // Median household income
  'B25001_001E', // Total housing units
  'B25003_002E', // Owner occupied
  'B25003_003E', // Renter occupied
  'B01002_001E', // Median age
  'B02001_002E', // White alone
  'B02001_003E', // Black or African American alone
  'B02001_005E', // Asian alone
  'B03003_003E', // Hispanic or Latino
  'B15003_022E', // Bachelor's degree or higher
  'B23025_005E', // Unemployed
  'B23025_002E', // Labor force
].join(',');

// Helper functions
const safeParseInt = (value) => {
  if (value === null || value === undefined || value === '' || value === '-999999999') {
    return null;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const safeParseDecimal = (value) => {
  if (value === null || value === undefined || value === '' || value === '-999999999') {
    return null;
  }
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed.toString();
};

const calculateUnemploymentRate = (unemployed, laborForce) => {
  if (!unemployed || !laborForce || laborForce === 0) return null;
  const rate = (unemployed / laborForce) * 100;
  return rate.toFixed(2);
};

// Create sample boundaries for census tracts (simplified rectangles across Brooklyn)
function createSampleGeometry(tractCode) {
  const tractNum = Number.parseInt(tractCode);
  const baseY = 40.6; // Base latitude for Brooklyn
  const baseX = -74.0; // Base longitude for Brooklyn
  
  // Create a grid pattern across Brooklyn
  const row = Math.floor(tractNum / 100) % 10;
  const col = tractNum % 10;
  
  const offsetY = row * 0.02; // Latitude offset
  const offsetX = col * 0.02; // Longitude offset
  
  const minY = baseY + offsetY;
  const maxY = minY + 0.015;
  const minX = baseX + offsetX;
  const maxX = minX + 0.015;
  
  return {
    type: 'Polygon',
    coordinates: [[
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
      [minX, minY]
    ]]
  };
}

async function fetchCensusData() {
  console.log('📊 Fetching ACS 2023 demographic data for Brooklyn census tracts...');
  
  // Fetch demographic data from ACS API for census tracts
  const dataUrl = `https://api.census.gov/data/${CENSUS_YEAR}/acs/acs5?get=${ACS_VARIABLES}&for=tract:*&in=state:${NY_STATE_FIPS}%20county:${KINGS_COUNTY_FIPS}&key=${CENSUS_API_KEY}`;
  
  console.log('🔗 API URL:', `${dataUrl.substring(0, 100)}...`);
  
  try {
    console.log('📡 Fetching demographic data...');
    const response = await fetch(dataUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Found demographic data for ${data.length - 1} census tracts`); // -1 for header row
    return data;
  } catch (error) {
    console.error('❌ Error fetching census data:', error);
    throw error;
  }
}

async function populateCensusTracts() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  if (!CENSUS_API_KEY || CENSUS_API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('CENSUS_API_KEY environment variable is not set');
  }

  const client = postgres(process.env.POSTGRES_URL);

  try {
    console.log('🚀 Starting census tracts population...');
    
    // Clear existing census blocks data
    console.log('🧹 Clearing existing census blocks...');
    await client`DELETE FROM "NYCCensusBlocks"`;
    
    // Fetch demographic data
    const demographicData = await fetchCensusData();
    
    // Process demographic data (skip header row)
    const headers = demographicData[0];
    const demographicRows = demographicData.slice(1);
    
    console.log(`📊 Processing ${demographicRows.length} census tracts...`);
    
    let processedCount = 0;
    
    // Process census tracts in batches
    const batchSize = 50;
    for (let i = 0; i < demographicRows.length; i += batchSize) {
      const batch = demographicRows.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          const state = row[headers.indexOf('state')];
          const county = row[headers.indexOf('county')];
          const tract = row[headers.indexOf('tract')];
          
          // Create a GEOID for the tract (treating as a block for compatibility)
          const geoid = `${state}${county}${tract}000`; // Add '000' to make it look like a block
          
          const unemployed = safeParseInt(row[headers.indexOf('B23025_005E')]);
          const laborForce = safeParseInt(row[headers.indexOf('B23025_002E')]);
          
          // Create sample geometry for this tract
          const geometry = createSampleGeometry(tract);
          
          // Insert GeoJSON data first
          const geoResult = await client`
            INSERT INTO "GeoJSONData" (data, metadata)
            VALUES (${JSON.stringify(geometry)}, ${JSON.stringify({ source: 'US Census Bureau ACS 2023', year: CENSUS_YEAR, type: 'tract' })})
            RETURNING id
          `;
          
          // Insert census "block" (actually tract) data
          await client`
            INSERT INTO "NYCCensusBlocks" (
              geoid, state, county, tract, block,
              "totalPopulation", "totalHouseholds", "occupiedHouseholds", "vacantHouseholds",
              "medianHouseholdIncome", "totalHousingUnits", "ownerOccupied", "renterOccupied",
              "medianAge", "whiteAlone", "blackAlone", "asianAlone", "hispanicLatino",
              "bachelorsOrHigher", "unemploymentRate", borough, "geojsonDataId"
            )
            VALUES (
              ${geoid}, ${state}, ${county}, ${tract}, '000',
              ${safeParseInt(row[headers.indexOf('B01003_001E')])},
              ${safeParseInt(row[headers.indexOf('B25002_001E')])},
              ${safeParseInt(row[headers.indexOf('B25002_002E')])},
              ${safeParseInt(row[headers.indexOf('B25002_003E')])},
              ${safeParseInt(row[headers.indexOf('B19013_001E')])},
              ${safeParseInt(row[headers.indexOf('B25001_001E')])},
              ${safeParseInt(row[headers.indexOf('B25003_002E')])},
              ${safeParseInt(row[headers.indexOf('B25003_003E')])},
              ${safeParseDecimal(row[headers.indexOf('B01002_001E')])},
              ${safeParseInt(row[headers.indexOf('B02001_002E')])},
              ${safeParseInt(row[headers.indexOf('B02001_003E')])},
              ${safeParseInt(row[headers.indexOf('B02001_005E')])},
              ${safeParseInt(row[headers.indexOf('B03003_003E')])},
              ${safeParseInt(row[headers.indexOf('B15003_022E')])},
              ${calculateUnemploymentRate(unemployed, laborForce)},
              'Brooklyn',
              ${geoResult[0].id}
            )
          `;
          
          processedCount++;
          
          if (processedCount % 10 === 0) {
            console.log(`📈 Processed ${processedCount} census tracts...`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing census tract:`, error);
        }
      }
    }
    
    // Check final count
    const result = await client`SELECT COUNT(*) FROM "NYCCensusBlocks"`;
    console.log(`✅ Successfully populated ${result[0].count} NYC census tracts (as blocks)`);
    
  } catch (error) {
    console.error('❌ Error populating census tracts:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the population script
populateCensusTracts()
  .then(() => {
    console.log('🎉 Census tracts population completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Census tracts population failed:', error);
    process.exit(1);
  });