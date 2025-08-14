const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

async function populateData() {
  console.log('🚀 Starting census data population...');
  
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL not found in environment');
  }
  
  const client = postgres(process.env.POSTGRES_URL);
  
  try {
    console.log('🧹 Clearing existing census blocks...');
    await client`DELETE FROM "NYCCensusBlocks"`;
    
    // Sample data
    const sampleGeometry = {
      type: 'Polygon',
      coordinates: [[
        [-73.9567, 40.7081],
        [-73.9567, 40.7181], 
        [-73.9467, 40.7181],
        [-73.9467, 40.7081],
        [-73.9567, 40.7081]
      ]]
    };
    
    console.log('📊 Inserting GeoJSON data...');
    
    // Insert GeoJSON first
    const geoResult = await client`
      INSERT INTO "GeoJSONData" (data, metadata)
      VALUES (${JSON.stringify(sampleGeometry)}, ${JSON.stringify({ source: 'Sample Data', year: '2023' })})
      RETURNING id
    `;
    
    const geoId = geoResult[0].id;
    console.log('✅ GeoJSON inserted with ID:', geoId);
    
    console.log('📊 Inserting census block...');
    
    // Insert census block
    await client`
      INSERT INTO "NYCCensusBlocks" (
        geoid, state, county, tract, block,
        "totalPopulation", "totalHouseholds", "medianHouseholdIncome",
        borough, "geojsonDataId"
      )
      VALUES (
        '360470001001000', '36', '047', '000100', '1000',
        150, 65, 75000,
        'Brooklyn', ${geoId}
      )
    `;
    
    console.log('✅ Census block inserted');
    
    // Insert a few more sample blocks
    const blocks = [
      {
        geoid: '360470001001001',
        tract: '000100',
        block: '1001',
        pop: 240,
        households: 98,
        income: 85000,
        coords: [[-73.9895, 40.7033], [-73.9895, 40.7133], [-73.9795, 40.7133], [-73.9795, 40.7033], [-73.9895, 40.7033]]
      },
      {
        geoid: '360470002001000',
        tract: '000200',
        block: '1000',
        pop: 89,
        households: 42,
        income: 65000,
        coords: [[-73.9863, 40.6712], [-73.9863, 40.6812], [-73.9763, 40.6812], [-73.9763, 40.6712], [-73.9863, 40.6712]]
      }
    ];
    
    for (const block of blocks) {
      const geometry = {
        type: 'Polygon',
        coordinates: [block.coords]
      };
      
      // Insert GeoJSON
      const geoResult = await client`
        INSERT INTO "GeoJSONData" (data, metadata)
        VALUES (${JSON.stringify(geometry)}, ${JSON.stringify({ source: 'Sample Data', year: '2023' })})
        RETURNING id
      `;
      
      // Insert census block
      await client`
        INSERT INTO "NYCCensusBlocks" (
          geoid, state, county, tract, block,
          "totalPopulation", "totalHouseholds", "medianHouseholdIncome",
          borough, "geojsonDataId"
        )
        VALUES (
          ${block.geoid}, '36', '047', ${block.tract}, ${block.block},
          ${block.pop}, ${block.households}, ${block.income},
          'Brooklyn', ${geoResult[0].id}
        )
      `;
      
      console.log(`✅ Inserted census block: ${block.geoid}`);
    }
    
    // Check final count
    const result = await client`SELECT COUNT(*) FROM "NYCCensusBlocks"`;
    console.log('📊 Final census blocks count:', result[0].count);
    
    console.log('🎉 Sample census data population completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

populateData().catch(console.error);