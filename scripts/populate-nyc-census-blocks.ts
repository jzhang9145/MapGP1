import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { nycCensusBlocks, geojsonData } from '../lib/db/schema.js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Census API configuration
const CENSUS_API_KEY = process.env.CENSUS_API_KEY || 'YOUR_API_KEY_HERE';
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

// Helper function to safely parse integers
const safeParseInt = (value: any): number | null => {
  if (value === null || value === undefined || value === '' || value === '-999999999') {
    return null;
  }
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? null : parsed;
};

// Helper function to safely parse decimals
const safeParseDecimal = (value: any): string | null => {
  if (value === null || value === undefined || value === '' || value === '-999999999') {
    return null;
  }
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? null : parsed.toString();
};

// Helper function to calculate unemployment rate
const calculateUnemploymentRate = (unemployed: number | null, laborForce: number | null): string | null => {
  if (!unemployed || !laborForce || laborForce === 0) return null;
  const rate = (unemployed / laborForce) * 100;
  return rate.toFixed(2);
};

async function fetchCensusBoundaries() {
  console.log('🗺️ Fetching census block boundaries for Brooklyn...');
  
  // Fetch census block boundaries from Census Bureau TIGER/Line API
  const boundariesUrl = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2023/MapServer/10/query?where=STATE=${NY_STATE_FIPS}+AND+COUNTY=${KINGS_COUNTY_FIPS}&outFields=*&returnGeometry=true&f=geojson`;
  
  try {
    console.log('📡 Fetching from:', boundariesUrl);
    const response = await fetch(boundariesUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Found ${data.features?.length || 0} census blocks`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching census boundaries:', error);
    throw error;
  }
}

async function fetchCensusData() {
  console.log('📊 Fetching ACS 2023 demographic data for Brooklyn census blocks...');
  
  // Fetch demographic data from ACS API
  const dataUrl = `https://api.census.gov/data/${CENSUS_YEAR}/acs/acs5?get=${ACS_VARIABLES}&for=block:*&in=state:${NY_STATE_FIPS}%20county:${KINGS_COUNTY_FIPS}&key=${CENSUS_API_KEY}`;
  
  try {
    console.log('📡 Fetching demographic data...');
    const response = await fetch(dataUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Found demographic data for ${data.length - 1} census blocks`); // -1 for header row
    return data;
  } catch (error) {
    console.error('❌ Error fetching census data:', error);
    console.log('💡 Note: You may need to get a free Census API key from https://api.census.gov/data/key_signup.html');
    throw error;
  }
}

async function populateCensusBlocks() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('🚀 Starting census blocks population...');
    
    // Clear existing census blocks data
    console.log('🧹 Clearing existing census blocks...');
    await db.delete(nycCensusBlocks);
    
    // Fetch boundaries and demographic data
    const [boundariesData, demographicData] = await Promise.all([
      fetchCensusBoundaries(),
      fetchCensusData()
    ]);
    
    // Process demographic data (skip header row)
    const headers = demographicData[0];
    const demographicRows = demographicData.slice(1);
    
    // Create a map of GEOID to demographic data
    const demographicMap = new Map();
    demographicRows.forEach((row: any[]) => {
      const state = row[headers.indexOf('state')];
      const county = row[headers.indexOf('county')];
      const tract = row[headers.indexOf('tract')];
      const block = row[headers.indexOf('block')];
      const geoid = `${state}${county}${tract}${block}`;
      
      demographicMap.set(geoid, {
        totalPopulation: safeParseInt(row[headers.indexOf('B01003_001E')]),
        totalHouseholds: safeParseInt(row[headers.indexOf('B25002_001E')]),
        occupiedHouseholds: safeParseInt(row[headers.indexOf('B25002_002E')]),
        vacantHouseholds: safeParseInt(row[headers.indexOf('B25002_003E')]),
        medianHouseholdIncome: safeParseInt(row[headers.indexOf('B19013_001E')]),
        totalHousingUnits: safeParseInt(row[headers.indexOf('B25001_001E')]),
        ownerOccupied: safeParseInt(row[headers.indexOf('B25003_002E')]),
        renterOccupied: safeParseInt(row[headers.indexOf('B25003_003E')]),
        medianAge: safeParseDecimal(row[headers.indexOf('B01002_001E')]),
        whiteAlone: safeParseInt(row[headers.indexOf('B02001_002E')]),
        blackAlone: safeParseInt(row[headers.indexOf('B02001_003E')]),
        asianAlone: safeParseInt(row[headers.indexOf('B02001_005E')]),
        hispanicLatino: safeParseInt(row[headers.indexOf('B03003_003E')]),
        bachelorsOrHigher: safeParseInt(row[headers.indexOf('B15003_022E')]),
        unemploymentRate: calculateUnemploymentRate(
          safeParseInt(row[headers.indexOf('B23025_005E')]),
          safeParseInt(row[headers.indexOf('B23025_002E')])
        ),
        state,
        county,
        tract,
        block
      });
    });
    
    console.log(`📊 Processing ${boundariesData.features.length} census blocks...`);
    
    let processedCount = 0;
    let skippedCount = 0;
    
    // Process census blocks in batches
    const batchSize = 100;
    for (let i = 0; i < boundariesData.features.length; i += batchSize) {
      const batch = boundariesData.features.slice(i, i + batchSize);
      const censusBlocksToInsert = [];
      
      for (const feature of batch) {
        try {
          const properties = feature.properties;
          const geometry = feature.geometry;
          
          if (!properties || !geometry) {
            skippedCount++;
            continue;
          }
          
          const geoid = properties.GEOID || properties.geoid;
          if (!geoid) {
            skippedCount++;
            continue;
          }
          
          // Get demographic data for this census block
          const demographics = demographicMap.get(geoid) || {};
          
          // Insert GeoJSON data first
          const [geoRecord] = await db.insert(geojsonData).values({
            data: geometry,
            metadata: { source: 'US Census Bureau TIGER/Line', year: CENSUS_YEAR }
          }).returning({ id: geojsonData.id });
          
          // Prepare census block data
          const censusBlockData = {
            geoid,
            state: demographics.state || NY_STATE_FIPS,
            county: demographics.county || KINGS_COUNTY_FIPS,
            tract: demographics.tract || geoid.substring(5, 11),
            block: demographics.block || geoid.substring(11),
            totalPopulation: demographics.totalPopulation,
            totalHouseholds: demographics.totalHouseholds,
            occupiedHouseholds: demographics.occupiedHouseholds,
            vacantHouseholds: demographics.vacantHouseholds,
            medianHouseholdIncome: demographics.medianHouseholdIncome,
            totalHousingUnits: demographics.totalHousingUnits,
            ownerOccupied: demographics.ownerOccupied,
            renterOccupied: demographics.renterOccupied,
            medianAge: demographics.medianAge,
            whiteAlone: demographics.whiteAlone,
            blackAlone: demographics.blackAlone,
            asianAlone: demographics.asianAlone,
            hispanicLatino: demographics.hispanicLatino,
            bachelorsOrHigher: demographics.bachelorsOrHigher,
            unemploymentRate: demographics.unemploymentRate,
            borough: 'Brooklyn',
            geojsonDataId: geoRecord.id,
          };
          
          censusBlocksToInsert.push(censusBlockData);
          processedCount++;
          
          if (processedCount % 100 === 0) {
            console.log(`📈 Processed ${processedCount} census blocks...`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing census block:`, error);
          skippedCount++;
        }
      }
      
      // Insert batch of census blocks
      if (censusBlocksToInsert.length > 0) {
        await db.insert(nycCensusBlocks).values(censusBlocksToInsert);
      }
    }
    
    console.log(`✅ Successfully populated ${processedCount} NYC census blocks`);
    console.log(`⏭️ Skipped ${skippedCount} invalid entries`);
    
  } catch (error) {
    console.error('❌ Error populating census blocks:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the population script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateCensusBlocks()
    .then(() => {
      console.log('🎉 Census blocks population completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Census blocks population failed:', error);
      process.exit(1);
    });
}