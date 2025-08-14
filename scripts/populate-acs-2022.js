const postgres = require('postgres');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const client = postgres(process.env.POSTGRES_URL);

// ACS 2022 API configuration
const ACS_BASE_URL = 'https://api.census.gov/data/2022/acs/acs5';
const CENSUS_API_KEY = process.env.CENSUS_API_KEY;

// Brooklyn/Kings County FIPS: State=36, County=047
const STATE_FIPS = '36';
const COUNTY_FIPS = '047';

// ACS 2022 Variables - same as 2023
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

async function fetchACS2022Data() {
  console.log('🏢 Fetching ACS 2022 demographic data for all Brooklyn census tracts...');
  
  if (!CENSUS_API_KEY) {
    throw new Error('CENSUS_API_KEY not found in environment variables. Please add it to .env.local');
  }
  
  try {
    // Build API URL for all tracts in Brooklyn
    const url = `${ACS_BASE_URL}?get=${variablesList}&for=tract:*&in=state:${STATE_FIPS}%20county:${COUNTY_FIPS}&key=${CENSUS_API_KEY}`;
    
    console.log('📡 Requesting 2022 data from Census ACS API...');
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
    
    console.log(`✅ Successfully fetched ACS 2022 data for ${rows.length} census tracts`);
    
    return { headers, rows };
    
  } catch (error) {
    console.error('❌ Error fetching ACS 2022 data:', error.message);
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
        if (!isNaN(parsed) && parsed >= 0) {
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
    parsed.unemploymentRate = rate >= 0 ? parseFloat(rate.toFixed(2)) : null;
  }
  
  if (parsed.totalEducationPop && parsed.bachelorsOrHigher && parsed.totalEducationPop > 0) {
    const rate = (parsed.bachelorsOrHigher / parsed.totalEducationPop) * 100;
    parsed.educationRate = rate >= 0 ? parseFloat(rate.toFixed(2)) : null;
  }
  
  // Create GEOID (11 digits: state + county + tract)
  parsed.geoid = `${parsed.state}${parsed.county}${parsed.tract}`;
  
  return parsed;
}

async function insertCensus2022Data(acsData) {
  console.log('💾 Inserting 2022 census tract data...');
  
  const { headers, rows } = acsData;
  let insertedCount = 0;
  let notFoundCount = 0;
  
  for (const row of rows) {
    const demographics = parseACSRow(headers, row);
    
    try {
      // Check if this tract already exists with 2022 data
      const existing = await client`
        SELECT id FROM "NYCCensusBlocks"
        WHERE geoid = ${demographics.geoid} AND "dataYear" = 2022
      `;
      
      if (existing.length > 0) {
        // Update existing 2022 record
        await client`
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
          WHERE geoid = ${demographics.geoid} AND "dataYear" = 2022
        `;
      } else {
        // Get the geojsonDataId from the 2023 record (same geometry)
        const geoRecord = await client`
          SELECT "geojsonDataId" FROM "NYCCensusBlocks"
          WHERE geoid = ${demographics.geoid} AND "dataYear" = 2023
          LIMIT 1
        `;
        
        if (geoRecord.length === 0) {
          notFoundCount++;
          continue;
        }
        
        // Insert new 2022 record
        await client`
          INSERT INTO "NYCCensusBlocks" (
            geoid, "dataYear", state, county, tract, block,
            "totalPopulation", "totalHouseholds", "occupiedHouseholds", "vacantHouseholds",
            "medianHouseholdIncome", "totalHousingUnits", "ownerOccupied", "renterOccupied",
            "medianAge", "whiteAlone", "blackAlone", "asianAlone", "hispanicLatino",
            "bachelorsOrHigher", "unemploymentRate", borough, "geojsonDataId"
          ) VALUES (
            ${demographics.geoid}, 2022, ${demographics.state}, ${demographics.county}, 
            ${demographics.tract}, '000',
            ${demographics.totalPopulation}, ${demographics.totalHouseholds}, 
            ${demographics.occupiedHouseholds}, ${demographics.vacantHouseholds},
            ${demographics.medianHouseholdIncome}, ${demographics.totalHousingUnits}, 
            ${demographics.ownerOccupied}, ${demographics.renterOccupied},
            ${demographics.medianAge}, ${demographics.whiteAlone}, ${demographics.blackAlone}, 
            ${demographics.asianAlone}, ${demographics.hispanicLatino},
            ${demographics.bachelorsOrHigher}, ${demographics.unemploymentRate}, 
            'Brooklyn', ${geoRecord[0].geojsonDataId}
          )
        `;
      }
      
      insertedCount++;
      if (insertedCount % 50 === 0) {
        console.log(`📊 Processed ${insertedCount} tracts...`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing tract ${demographics.geoid}:`, error.message);
    }
  }
  
  console.log(`✅ Successfully processed ${insertedCount} census tracts with 2022 ACS data`);
  if (notFoundCount > 0) {
    console.log(`⚠️ ${notFoundCount} tracts from ACS 2022 not found in 2023 data`);
  }
  
  return insertedCount;
}

async function showGrowthSample() {
  console.log('\n📈 SAMPLE GROWTH ANALYSIS:');
  console.log('=====================================');
  
  const growthSamples = await client`
    SELECT 
      t2023.geoid,
      t2023.tract,
      t2023."totalPopulation" as pop_2023,
      t2022."totalPopulation" as pop_2022,
      CASE 
        WHEN t2022."totalPopulation" > 0 AND t2023."totalPopulation" IS NOT NULL
        THEN ROUND(((t2023."totalPopulation" - t2022."totalPopulation")::numeric / t2022."totalPopulation" * 100), 2)
        ELSE NULL 
      END as population_growth_pct,
      t2023."medianHouseholdIncome" as income_2023,
      t2022."medianHouseholdIncome" as income_2022,
      CASE 
        WHEN t2022."medianHouseholdIncome" > 0 AND t2023."medianHouseholdIncome" IS NOT NULL
        THEN ROUND(((t2023."medianHouseholdIncome" - t2022."medianHouseholdIncome")::numeric / t2022."medianHouseholdIncome" * 100), 2)
        ELSE NULL 
      END as income_growth_pct
    FROM "NYCCensusBlocks" t2023
    JOIN "NYCCensusBlocks" t2022 ON t2023.geoid = t2022.geoid
    WHERE t2023."dataYear" = 2023 
      AND t2022."dataYear" = 2022
      AND t2023."totalPopulation" IS NOT NULL 
      AND t2022."totalPopulation" IS NOT NULL
    ORDER BY population_growth_pct DESC NULLS LAST
    LIMIT 5
  `;
  
  growthSamples.forEach((tract, i) => {
    console.log(`${i + 1}. Tract ${tract.tract} (GEOID: ${tract.geoid})`);
    console.log(`   Population: ${tract.pop_2022?.toLocaleString()} → ${tract.pop_2023?.toLocaleString()} (${tract.population_growth_pct || 'N/A'}%)`);
    console.log(`   Income: $${tract.income_2022?.toLocaleString()} → $${tract.income_2023?.toLocaleString()} (${tract.income_growth_pct || 'N/A'}%)`);
    console.log('');
  });
  
  // Show overall statistics
  const stats = await client`
    SELECT 
      COUNT(*) as total_comparable_tracts,
      AVG(CASE 
        WHEN t2022."totalPopulation" > 0 AND t2023."totalPopulation" IS NOT NULL
        THEN ((t2023."totalPopulation" - t2022."totalPopulation")::numeric / t2022."totalPopulation" * 100)
        ELSE NULL 
      END) as avg_population_growth,
      AVG(CASE 
        WHEN t2022."medianHouseholdIncome" > 0 AND t2023."medianHouseholdIncome" IS NOT NULL
        THEN ((t2023."medianHouseholdIncome" - t2022."medianHouseholdIncome")::numeric / t2022."medianHouseholdIncome" * 100)
        ELSE NULL 
      END) as avg_income_growth
    FROM "NYCCensusBlocks" t2023
    JOIN "NYCCensusBlocks" t2022 ON t2023.geoid = t2022.geoid
    WHERE t2023."dataYear" = 2023 AND t2022."dataYear" = 2022
  `;
  
  const stat = stats[0];
  console.log('📊 BROOKLYN GROWTH STATISTICS (2022 → 2023):');
  console.log('=====================================');
  console.log(`Comparable tracts: ${stat.total_comparable_tracts}`);
  console.log(`Average population growth: ${stat.avg_population_growth ? parseFloat(stat.avg_population_growth).toFixed(2) + '%' : 'N/A'}`);
  console.log(`Average income growth: ${stat.avg_income_growth ? parseFloat(stat.avg_income_growth).toFixed(2) + '%' : 'N/A'}`);
}

async function populateACS2022Data() {
  try {
    console.log('🚀 Starting ACS 2022 demographic data population...');
    
    // Fetch data from Census API
    const acsData = await fetchACS2022Data();
    
    // Insert/update database with 2022 demographic data
    const processedCount = await insertCensus2022Data(acsData);
    
    // Show growth analysis sample
    await showGrowthSample();
    
    console.log('\n🎉 ACS 2022 data population completed!');
    console.log(`✅ Processed ${processedCount} census tracts with 2022 demographic data`);
    console.log('📈 Growth calculations are now available for 2022 → 2023 comparisons!');
    
  } catch (error) {
    console.error('❌ Failed to populate ACS 2022 data:', error);
  } finally {
    await client.end();
  }
}

populateACS2022Data();