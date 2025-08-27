const postgres = require('postgres');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const client = postgres(process.env.POSTGRES_URL);

// ACS 2023 API configuration
const ACS_BASE_URL = 'https://api.census.gov/data/2023/acs/acs5';
const CENSUS_API_KEY = process.env.CENSUS_API_KEY;

// Brooklyn/Kings County FIPS: State=36, County=047
const STATE_FIPS = '36';
const COUNTY_FIPS = '047';

// ACS 2023 Variables we want to fetch
const ACS_VARIABLES = {
  // Population
  'B01003_001E': 'totalPopulation',           // Total population
  'B01002_001E': 'medianAge',                 // Median age
  
  // Income & Economics
  'B19013_001E': 'medianHouseholdIncome',     // Median household income
  'B25064_001E': 'medianGrossRent',           // Median gross rent
  'B08303_001E': 'medianCommuteTime',         // Median travel time to work
  
  // Education
  'B15003_022E': 'bachelorsOrHigher',         // Bachelor's degree or higher
  'B15003_001E': 'totalEducationPop',         // Total population 25+ (for education %)
  
  // Employment
  'B23025_001E': 'laborForce',                // Total labor force
  'B23025_005E': 'unemployed',                // Unemployed
  
  // Housing
  'B25001_001E': 'totalHousingUnits',         // Total housing units
  'B25002_001E': 'totalHouseholds',           // Total households
  'B25002_002E': 'occupiedHouseholds',        // Occupied households
  'B25002_003E': 'vacantHouseholds',          // Vacant households
  'B25003_002E': 'ownerOccupied',             // Owner-occupied
  'B25003_003E': 'renterOccupied',            // Renter-occupied
  
  // Race/Ethnicity
  'B02001_002E': 'whiteAlone',                // White alone
  'B02001_003E': 'blackAlone',                // Black or African American alone
  'B02001_005E': 'asianAlone',                // Asian alone
  'B03003_003E': 'hispanicLatino',            // Hispanic or Latino
};

// Build the variables string for API call
const variablesList = Object.keys(ACS_VARIABLES).join(',');

async function fetchACSData() {
  console.log('🏢 Fetching ACS 2023 demographic data for all Brooklyn census tracts...');
  
  if (!CENSUS_API_KEY) {
    throw new Error('CENSUS_API_KEY not found in environment variables. Please add it to .env.local');
  }
  
  try {
    // Build API URL for all tracts in Brooklyn
    const url = `${ACS_BASE_URL}?get=${variablesList}&for=tract:*&in=state:${STATE_FIPS}%20county:${COUNTY_FIPS}&key=${CENSUS_API_KEY}`;
    
    console.log('📡 Requesting data from Census ACS API...');
    console.log('Variables:', Object.values(ACS_VARIABLES).join(', '));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Census API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid response format from Census API');
    }
    
    // First row is headers, rest are data
    const headers = data[0];
    const rows = data.slice(1);
    
    console.log(`✅ Successfully fetched ACS data for ${rows.length} census tracts`);
    
    return { headers, rows };
    
  } catch (error) {
    console.error('❌ Error fetching ACS data:', error.message);
    throw error;
  }
}

function parseACSRow(headers, row) {
  const parsed = {};
  
  // Map each value to its variable name
  headers.forEach((header, index) => {
    const value = row[index];
    
    if (ACS_VARIABLES[header]) {
      const fieldName = ACS_VARIABLES[header];
      // Convert to number if it's a numeric value, keep as null if invalid
      let numValue = null;
      if (value !== null && value !== '-' && value !== '' && value !== undefined) {
        const parsed = Number(value);
        // Only accept positive numbers for demographic data (some ACS values can be negative for margins of error)
        if (!Number.isNaN(parsed) && parsed >= 0) {
          numValue = parsed;
        }
      }
      parsed[fieldName] = numValue;
    } else if (header === 'state') {
      parsed.state = value;
    } else if (header === 'county') {
      parsed.county = value;
    } else if (header === 'tract') {
      parsed.tract = value;
    }
  });
  
  // Calculate derived fields - only if we have valid positive numbers
  if (parsed.laborForce && parsed.unemployed && parsed.laborForce > 0) {
    const rate = (parsed.unemployed / parsed.laborForce) * 100;
    parsed.unemploymentRate = rate >= 0 ? Number.parseFloat(rate.toFixed(2)) : null;
  }
  
  if (parsed.totalEducationPop && parsed.bachelorsOrHigher && parsed.totalEducationPop > 0) {
    const rate = (parsed.bachelorsOrHigher / parsed.totalEducationPop) * 100;
    parsed.educationRate = rate >= 0 ? Number.parseFloat(rate.toFixed(2)) : null;
  }
  
  // Create GEOID (11 digits: state + county + tract)
  parsed.geoid = `${parsed.state}${parsed.county}${parsed.tract}`;
  
  return parsed;
}

async function updateCensusTractDemographics(acsData) {
  console.log('💾 Updating census tracts with demographic data...');
  
  const { headers, rows } = acsData;
  let updatedCount = 0;
  let notFoundCount = 0;
  
  for (const row of rows) {
    const demographics = parseACSRow(headers, row);
    
    try {
      // Update the existing census tract record
      const result = await client`
        UPDATE "NYCCensusBlocks"
        SET 
          "totalPopulation" = ${demographics.totalPopulation},
          "medianAge" = ${demographics.medianAge},
          "medianHouseholdIncome" = ${demographics.medianHouseholdIncome},
          "totalHouseholds" = ${demographics.totalHouseholds},
          "occupiedHouseholds" = ${demographics.occupiedHouseholds},
          "vacantHouseholds" = ${demographics.vacantHouseholds},
          "totalHousingUnits" = ${demographics.totalHousingUnits},
          "ownerOccupied" = ${demographics.ownerOccupied},
          "renterOccupied" = ${demographics.renterOccupied},
          "whiteAlone" = ${demographics.whiteAlone},
          "blackAlone" = ${demographics.blackAlone},
          "asianAlone" = ${demographics.asianAlone},
          "hispanicLatino" = ${demographics.hispanicLatino},
          "bachelorsOrHigher" = ${demographics.bachelorsOrHigher},
          "unemploymentRate" = ${demographics.unemploymentRate},
          "updatedAt" = NOW()
        WHERE geoid = ${demographics.geoid}
      `;
      
      if (result.count > 0) {
        updatedCount++;
        if (updatedCount % 50 === 0) {
          console.log(`📊 Updated ${updatedCount} tracts...`);
        }
      } else {
        notFoundCount++;
        if (notFoundCount <= 5) {
          console.log(`⚠️ Tract not found in database: ${demographics.geoid}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error updating tract ${demographics.geoid}:`, error.message);
    }
  }
  
  console.log(`✅ Successfully updated ${updatedCount} census tracts with ACS data`);
  if (notFoundCount > 0) {
    console.log(`⚠️ ${notFoundCount} tracts from ACS not found in database (may be different vintages)`);
  }
  
  return updatedCount;
}

async function showSampleData() {
  console.log('\n📊 SAMPLE DEMOGRAPHIC DATA:');
  console.log('=====================================');
  
  const samples = await client`
    SELECT 
      geoid,
      "totalPopulation",
      "medianHouseholdIncome",
      "unemploymentRate",
      "bachelorsOrHigher",
      tract
    FROM "NYCCensusBlocks"
    WHERE "totalPopulation" IS NOT NULL
    ORDER BY "medianHouseholdIncome" DESC NULLS LAST
    LIMIT 5
  `;
  
  samples.forEach((tract, i) => {
    console.log(`${i + 1}. Tract ${tract.tract} (GEOID: ${tract.geoid})`);
    console.log(`   Population: ${tract.totalPopulation?.toLocaleString() || 'N/A'}`);
    console.log(`   Median Income: $${tract.medianHouseholdIncome?.toLocaleString() || 'N/A'}`);
    console.log(`   Unemployment: ${tract.unemploymentRate || 'N/A'}%`);
    console.log(`   Bachelor's+: ${tract.bachelorsOrHigher?.toLocaleString() || 'N/A'}`);
    console.log('');
  });
  
  // Show statistics
  const stats = await client`
    SELECT 
      COUNT(*) as total_tracts,
      COUNT("totalPopulation") as with_population,
      COUNT("medianHouseholdIncome") as with_income,
      AVG("medianHouseholdIncome") as avg_income,
      MAX("medianHouseholdIncome") as max_income,
      MIN("medianHouseholdIncome") as min_income
    FROM "NYCCensusBlocks"
  `;
  
  const stat = stats[0];
  console.log('📈 OVERALL STATISTICS:');
  console.log('=====================================');
  console.log(`Total tracts: ${stat.total_tracts}`);
  console.log(`With demographic data: ${stat.with_population}`);
  console.log(`With income data: ${stat.with_income}`);
  console.log(`Average income: $${Math.round(stat.avg_income || 0).toLocaleString()}`);
  console.log(`Income range: $${Math.round(stat.min_income || 0).toLocaleString()} - $${Math.round(stat.max_income || 0).toLocaleString()}`);
}

async function populateACSData() {
  try {
    console.log('🚀 Starting ACS 2023 demographic data population...');
    
    // Fetch data from Census API
    const acsData = await fetchACSData();
    
    // Update database with demographic data
    const updatedCount = await updateCensusTractDemographics(acsData);
    
    // Show sample results
    await showSampleData();
    
    console.log('\n🎉 ACS demographic data population completed!');
    console.log(`✅ Updated ${updatedCount} census tracts with real demographic data`);
    
  } catch (error) {
    console.error('❌ Failed to populate ACS data:', error);
  } finally {
    await client.end();
  }
}

populateACSData();