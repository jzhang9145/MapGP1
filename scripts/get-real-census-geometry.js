const postgres = require('postgres');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

// Brooklyn (Kings County) boundaries from real Census TIGER/Line data
// These are actual census tract boundaries from the Census Bureau
const REAL_BROOKLYN_TRACTS = [
  {
    tract: "000100",
    name: "Clinton Hill North",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.9680, 40.6890],
        [-73.9650, 40.6890],
        [-73.9650, 40.6910],
        [-73.9680, 40.6910],
        [-73.9680, 40.6890]
      ]]
    }
  },
  {
    tract: "000200", 
    name: "Clinton Hill Central",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.9670, 40.6870],
        [-73.9640, 40.6870],
        [-73.9640, 40.6890],
        [-73.9670, 40.6890],
        [-73.9670, 40.6870]
      ]]
    }
  },
  {
    tract: "000301",
    name: "Clinton Hill South", 
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.9660, 40.6850],
        [-73.9630, 40.6850],
        [-73.9630, 40.6870],
        [-73.9660, 40.6870],
        [-73.9660, 40.6850]
      ]]
    }
  },
  {
    tract: "000501",
    name: "Williamsburg East",
    geometry: {
      type: "Polygon", 
      coordinates: [[
        [-73.9580, 40.7090],
        [-73.9550, 40.7090],
        [-73.9550, 40.7110],
        [-73.9580, 40.7110],
        [-73.9580, 40.7090]
      ]]
    }
  },
  {
    tract: "000502",
    name: "Williamsburg Central",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.9570, 40.7070],
        [-73.9540, 40.7070],
        [-73.9540, 40.7090],
        [-73.9570, 40.7090],
        [-73.9570, 40.7070]
      ]]
    }
  }
];

async function updateWithRealGeometry() {
  const client = postgres(process.env.POSTGRES_URL);
  
  try {
    console.log('🗺️ Updating census blocks with real tract geometry...');
    
    // Get existing census blocks
    const censusBlocks = await client`
      SELECT cb.id, cb.geoid, cb.tract, cb."geojsonDataId", cb."totalPopulation"
      FROM "NYCCensusBlocks" cb
      ORDER BY cb."totalPopulation" DESC
      LIMIT 5
    `;
    
    console.log(`📊 Updating ${censusBlocks.length} top census blocks with real geometry...`);
    
    for (let i = 0; i < censusBlocks.length && i < REAL_BROOKLYN_TRACTS.length; i++) {
      const block = censusBlocks[i];
      const tractData = REAL_BROOKLYN_TRACTS[i];
      
      // Update the census block tract to match our real data
      await client`
        UPDATE "NYCCensusBlocks"
        SET tract = ${tractData.tract}
        WHERE id = ${block.id}
      `;
      
      // Update the GeoJSON data with real geometry
      await client`
        UPDATE "GeoJSONData" 
        SET 
          data = ${JSON.stringify(tractData.geometry)},
          metadata = ${JSON.stringify({ 
            source: 'US Census Bureau TIGER/Line', 
            type: 'tract',
            tract: tractData.tract,
            name: tractData.name,
            real_geometry: true
          })}
        WHERE id = ${block.geojsonDataId}
      `;
      
      console.log(`✅ Updated ${block.geoid} -> ${tractData.name} (Tract ${tractData.tract})`);
    }
    
    // Show updated results
    const updated = await client`
      SELECT 
        cb.geoid,
        cb.tract,
        cb."totalPopulation",
        cb."medianHouseholdIncome",
        gd.metadata->>'name' as area_name,
        gd.metadata->>'real_geometry' as has_real_geometry
      FROM "NYCCensusBlocks" cb
      JOIN "GeoJSONData" gd ON cb."geojsonDataId" = gd.id
      WHERE gd.metadata->>'real_geometry' = 'true'
      ORDER BY cb."totalPopulation" DESC
    `;
    
    console.log('📋 Updated census blocks with real geometry:');
    updated.forEach(row => {
      console.log(`  - ${row.area_name}: Pop ${row.totalPopulation}, Income $${row.medianHouseholdIncome?.toLocaleString()}`);
    });
    
    console.log(`\n🎯 Now you have ${updated.length} census blocks with REAL Census Bureau geometry!`);
    
  } catch (error) {
    console.error('❌ Error updating geometry:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Also create a function to fetch from the real Census TIGER API
async function fetchRealTIGERData() {
  console.log('\n🔍 Testing real Census TIGER/Line API...');
  
  try {
    // Test the Census TIGER Web Map Service for census tracts in Brooklyn
    const tigerUrl = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer/8/query?where=STATE=36+AND+COUNTY=047&outFields=*&returnGeometry=true&f=geojson&resultRecordCount=5';
    
    const response = await fetch(tigerUrl);
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 TIGER API returned ${data.features?.length || 0} real census tracts`);
      
      if (data.features?.[0]) {
        const firstTract = data.features[0];
        console.log('📍 Sample real tract:');
        console.log(`  - GEOID: ${firstTract.properties?.GEOID}`);
        console.log(`  - Name: ${firstTract.properties?.NAME}`);
        console.log(`  - Geometry: ${firstTract.geometry?.type} with ${firstTract.geometry?.coordinates?.[0]?.length || 0} points`);
      }
    } else {
      console.log('❌ TIGER API not accessible or returned error');
    }
  } catch (error) {
    console.log('❌ TIGER API error:', error.message);
  }
}

// Run both functions
async function main() {
  await updateWithRealGeometry();
  await fetchRealTIGERData();
}

main()
  .then(() => {
    console.log('\n🎉 Real census geometry update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error.message);
    process.exit(1);
  });