const { config } = require('dotenv');
config({ path: '.env.local' });

const postgres = require('postgres');

// Initialize database connection
const client = postgres(process.env.POSTGRES_URL);

async function populateMapPLUTOBrooklyn() {
  try {
    console.log('🏗️ Starting MapPLUTO data population for Brooklyn...');

    // First, let's check if we need to clear existing data
    const existingCount = await client`
      SELECT COUNT(*) as count FROM "NYCMapPLUTO" WHERE borough = 'Brooklyn'
    `;
    
    console.log(`📊 Existing Brooklyn MapPLUTO records: ${existingCount[0].count}`);
    
    if (existingCount[0].count > 0) {
      console.log('⚠️ Existing data found. Clearing Brooklyn MapPLUTO data...');
      await client`DELETE FROM "NYCMapPLUTO" WHERE borough = 'Brooklyn'`;
      console.log('✅ Cleared existing Brooklyn MapPLUTO data');
    }

    // NYC Open Data MapPLUTO API endpoint for Brooklyn (Kings County)
    // Using the latest MapPLUTO dataset
    const apiUrl = 'https://data.cityofnewyork.us/resource/64uk-42ks.json';
    
    console.log('📡 Fetching MapPLUTO data from NYC Open Data...');
    console.log(`🔗 API URL: ${apiUrl}`);
    
    // Fetch exactly 100 properties from Brooklyn
    const targetCount = 100;
    const limit = 100; // Fetch 100 at once
    let totalProcessed = 0;
    
    console.log(`📥 Fetching ${targetCount} Brooklyn properties...`);
    
    // Construct the API query for Brooklyn only, ordered by assessment for consistency
    const queryUrl = `${apiUrl}?borough=BK&$limit=${limit}&$order=assesstot DESC`;
    
    const response = await fetch(queryUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No data received from API');
    }
      
    console.log(`📋 Processing ${data.length} properties...`);
    
    // Process the data and prepare for insertion
    const processedData = data.map(row => {
        // Clean and validate the data
        const cleanValue = (val) => {
          if (val === null || val === undefined || val === '' || val === 'null') return null;
          return val;
        };
        
        const cleanNumber = (val) => {
          if (val === null || val === undefined || val === '' || val === 'null') return null;
          const num = Number.parseFloat(val);
          return Number.isNaN(num) ? null : num;
        };
        
        const cleanInteger = (val) => {
          if (val === null || val === undefined || val === '' || val === 'null') return null;
          const num = Number.parseInt(val);
          return Number.isNaN(num) ? null : num;
        };
        
        // Build address from available fields
        let address = '';
        if (row.address) {
          address = row.address;
        } else {
          // Try to construct from individual components
          const parts = [];
          if (row.housenum_lo) parts.push(row.housenum_lo);
          if (row.housenum_hi && row.housenum_hi !== row.housenum_lo) parts.push(`-${row.housenum_hi}`);
          if (row.streetname) parts.push(row.streetname);
          address = parts.join(' ').trim();
        }
        
        return {
          // Property Identifiers
          bbl: cleanValue(row.bbl) || '',
          borough: 'Brooklyn', // We're only fetching Brooklyn
          block: cleanValue(row.block),
          lot: cleanValue(row.lot),
          cd: cleanValue(row.cd),
          
          // Property Classification
          bldgclass: cleanValue(row.bldgclass),
          landuse: cleanValue(row.landuse),
          ownertype: cleanValue(row.ownertype),
          ownername: cleanValue(row.ownername),
          
          // Property Dimensions
          lotarea: cleanInteger(row.lotarea),
          bldgarea: cleanInteger(row.bldgarea),
          comarea: cleanInteger(row.comarea),
          resarea: cleanInteger(row.resarea),
          officearea: cleanInteger(row.officearea),
          retailarea: cleanInteger(row.retailarea),
          garagearea: cleanInteger(row.garagearea),
          strgearea: cleanInteger(row.strgearea),
          factryarea: cleanInteger(row.factryarea),
          otherarea: cleanInteger(row.otherarea),
          areasource: cleanValue(row.areasource),
          
          // Building Details
          numbldgs: cleanInteger(row.numbldgs),
          numfloors: cleanNumber(row.numfloors),
          unitsres: cleanInteger(row.unitsres),
          unitstotal: cleanInteger(row.unitstotal),
          
          // Lot Measurements
          lotfront: cleanNumber(row.lotfront),
          lotdepth: cleanNumber(row.lotdepth),
          bldgfront: cleanNumber(row.bldgfront),
          bldgdepth: cleanNumber(row.bldgdepth),
          
          // Property Characteristics
          ext: cleanValue(row.ext),
          proxcode: cleanValue(row.proxcode),
          irrlotcode: cleanValue(row.irrlotcode),
          lottype: cleanValue(row.lottype),
          bsmtcode: cleanValue(row.bsmtcode),
          
          // Assessment & Valuation
          assessland: cleanInteger(row.assessland),
          assesstot: cleanInteger(row.assesstot),
          exempttot: cleanInteger(row.exempttot),
          
          // Historical Information
          yearbuilt: cleanInteger(row.yearbuilt),
          yearalter1: cleanInteger(row.yearalter1),
          yearalter2: cleanInteger(row.yearalter2),
          histdist: cleanValue(row.histdist),
          landmark: cleanValue(row.landmark),
          
          // Floor Area Ratio (FAR)
          builtfar: cleanNumber(row.builtfar),
          residfar: cleanNumber(row.residfar),
          commfar: cleanNumber(row.commfar),
          facilfar: cleanNumber(row.facilfar),
          
          // Geographic Identifiers
          borocode: cleanValue(row.borocode),
          condono: cleanValue(row.condono),
          tract2010: cleanValue(row.tract2010),
          xcoord: cleanInteger(row.xcoord),
          ycoord: cleanInteger(row.ycoord),
          
          // Zoning
          zonemap: cleanValue(row.zonemap),
          zmcode: cleanValue(row.zmcode),
          sanborn: cleanValue(row.sanborn),
          taxmap: cleanValue(row.taxmap),
          edesignum: cleanValue(row.edesignum),
          
          // Additional Identifiers
          appbbl: cleanValue(row.appbbl),
          appdate: cleanValue(row.appdate),
          plutomapid: cleanValue(row.plutomapid),
          version: cleanValue(row.version),
          
          // Address Information
          address: address || null,
          zipcode: cleanValue(row.zipcode),
          
          // GeoJSON will be populated separately
          geojsonDataId: null,
        };
    });
    
    // Filter out any rows with missing required data
    const validData = processedData.filter(row => row.bbl && row.borough);
    
    if (validData.length > 0) {
      console.log(`💾 Inserting ${validData.length} valid properties...`);
      
      // Insert all properties at once since we only have 100
      await client`
        INSERT INTO "NYCMapPLUTO" ${client(validData, 
          'bbl', 'borough', 'block', 'lot', 'cd', 'bldgclass', 'landuse', 'ownertype', 'ownername',
          'lotarea', 'bldgarea', 'comarea', 'resarea', 'officearea', 'retailarea', 'garagearea', 
          'strgearea', 'factryarea', 'otherarea', 'areasource', 'numbldgs', 'numfloors', 'unitsres', 
          'unitstotal', 'lotfront', 'lotdepth', 'bldgfront', 'bldgdepth', 'ext', 'proxcode', 
          'irrlotcode', 'lottype', 'bsmtcode', 'assessland', 'assesstot', 'exempttot', 'yearbuilt', 
          'yearalter1', 'yearalter2', 'histdist', 'landmark', 'builtfar', 'residfar', 'commfar', 
          'facilfar', 'borocode', 'condono', 'tract2010', 'xcoord', 'ycoord', 'zonemap', 'zmcode', 
          'sanborn', 'taxmap', 'edesignum', 'appbbl', 'appdate', 'plutomapid', 'version', 'address', 
          'zipcode', 'geojsonDataId'
        )}
      `;
      
      totalProcessed = validData.length;
    }
    
    console.log(`🎉 MapPLUTO population complete! Total properties: ${totalProcessed}`);
    
    // Show some statistics
    const stats = await client`
      SELECT 
        COUNT(*) as total_properties,
        COUNT(DISTINCT bldgclass) as unique_building_classes,
        COUNT(DISTINCT landuse) as unique_land_uses,
        AVG(assesstot) as avg_assessment,
        MIN(yearbuilt) as oldest_building,
        MAX(yearbuilt) as newest_building
      FROM "NYCMapPLUTO" 
      WHERE borough = 'Brooklyn' AND assesstot IS NOT NULL AND yearbuilt IS NOT NULL
    `;
    
    console.log('📊 Brooklyn MapPLUTO Statistics:');
    console.log(`   Total Properties: ${stats[0].total_properties}`);
    console.log(`   Building Classes: ${stats[0].unique_building_classes}`);
    console.log(`   Land Use Types: ${stats[0].unique_land_uses}`);
    console.log(`   Avg Assessment: $${Math.round(stats[0].avg_assessment).toLocaleString()}`);
    console.log(`   Building Years: ${stats[0].oldest_building} - ${stats[0].newest_building}`);
    
    // Show top building classes
    const topClasses = await client`
      SELECT bldgclass, COUNT(*) as count
      FROM "NYCMapPLUTO" 
      WHERE borough = 'Brooklyn' AND bldgclass IS NOT NULL
      GROUP BY bldgclass
      ORDER BY count DESC
      LIMIT 10
    `;
    
    console.log('🏗️ Top Building Classes:');
    topClasses.forEach(cls => {
      console.log(`   ${cls.bldgclass}: ${cls.count} properties`);
    });
    
  } catch (error) {
    console.error('❌ Error populating MapPLUTO data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the population if called directly
if (require.main === module) {
  populateMapPLUTOBrooklyn()
    .then(() => {
      console.log('✅ MapPLUTO population completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ MapPLUTO population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateMapPLUTOBrooklyn };
