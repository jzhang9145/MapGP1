const postgres = require('postgres');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const client = postgres(process.env.POSTGRES_URL);

// Brooklyn/Kings County FIPS code is 047
// State FIPS code for NY is 36
const BROOKLYN_COUNTY_FIPS = '047';
const NY_STATE_FIPS = '36';

async function fetchRealCensusBoundaries() {
  console.log('🗺️ Fetching REAL census tract boundaries from Census Bureau TIGERweb...');
  
  try {
    // TIGERweb REST API URL for census tracts
    // Layer 0 is Census Tracts
    const baseUrl = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/0/query';
    
    // Query parameters for Brooklyn census tracts
    const params = new URLSearchParams({
      where: `COUNTY='${BROOKLYN_COUNTY_FIPS}' AND STATE='${NY_STATE_FIPS}'`,
      outFields: 'STATE,COUNTY,TRACT,GEOID,NAME,BASENAME,MTFCC,FUNCSTAT,AREALAND,AREAWATER,INTPTLAT,INTPTLON',
      returnGeometry: 'true',
      f: 'geojson'
    });

    const url = `${baseUrl}?${params}`;
    
    console.log('📡 Requesting data from:', url.substring(0, 100) + '...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Successfully fetched census tract data');
    console.log('🔍 Raw API response:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    console.log(`📊 Found ${data.features?.length || 0} census tracts for Brooklyn`);
    
    if (!data.features || data.features.length === 0) {
      console.log('❌ Debug info:');
      console.log('- Response keys:', Object.keys(data));
      console.log('- Features property exists:', 'features' in data);
      console.log('- Full response:', JSON.stringify(data, null, 2));
      throw new Error('No census tract features returned from API');
    }

    // Clear existing census blocks data
    console.log('🧹 Clearing existing census blocks...');
    await client`DELETE FROM "NYCCensusBlocks"`;
    await client`DELETE FROM "GeoJSONData" WHERE metadata->>'source' = 'Census Bureau TIGER/Line'`;

    console.log('💾 Inserting real census tract boundaries...');
    
    let insertedCount = 0;
    
    for (const feature of data.features) { // Process ALL Brooklyn census tracts
      const props = feature.properties;
      const geometry = feature.geometry;
      
      // Skip if no geometry
      if (!geometry || !geometry.coordinates) {
        console.log(`⚠️ Skipping tract ${props.GEOID}: No geometry`);
        continue;
      }

      try {
        // Insert GeoJSON data first
        const geoResult = await client`
          INSERT INTO "GeoJSONData" (data, metadata)
          VALUES (${JSON.stringify(geometry)}, ${JSON.stringify({
            source: 'Census Bureau TIGER/Line',
            year: '2020',
            tractName: props.NAME,
            geoid: props.GEOID,
            fetched: new Date().toISOString()
          })})
          RETURNING id
        `;

        const geoId = geoResult[0].id;

        // Create census block record with real tract data
        await client`
          INSERT INTO "NYCCensusBlocks" (
            geoid, state, county, tract, block,
            "totalPopulation", "totalHouseholds", "occupiedHouseholds", "vacantHouseholds",
            "medianHouseholdIncome", "totalHousingUnits", "ownerOccupied", "renterOccupied",
            "medianAge", "whiteAlone", "blackAlone", "asianAlone", "hispanicLatino",
            "bachelorsOrHigher", "unemploymentRate", borough, "geojsonDataId"
          ) VALUES (
            ${props.GEOID}, ${props.STATE}, ${props.COUNTY}, ${props.TRACT}, '000',
            null, null, null, null,
            null, null, null, null,
            null, null, null, null, null,
            null, null, 'Brooklyn', ${geoId}
          )
        `;

        console.log(`✅ Inserted tract ${props.GEOID} (${props.NAME})`);
        insertedCount++;

      } catch (error) {
        console.error(`❌ Error inserting tract ${props.GEOID}:`, error.message);
      }
    }

    console.log(`🎉 Successfully inserted ${insertedCount} real census tract boundaries!`);
    
    // Show some examples
    console.log('\n📍 Sample tract info:');
    data.features.slice(0, 3).forEach((feature, i) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      console.log(`${i + 1}. GEOID: ${props.GEOID}`);
      console.log(`   Name: ${props.NAME}`);
      console.log(`   Area: ${(props.AREALAND / 1000000).toFixed(2)} sq km`);
      console.log(`   Coordinates: ${coords[0]?.length || 0} points`);
    });

  } catch (error) {
    console.error('❌ Error fetching census boundaries:', error);
  } finally {
    await client.end();
  }
}

fetchRealCensusBoundaries();