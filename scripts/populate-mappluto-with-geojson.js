const { config } = require('dotenv');
config({ path: '.env.local' });

const postgres = require('postgres');

// Initialize database connection
const client = postgres(process.env.POSTGRES_URL);

async function populateMapPLUTOWithGeoJSON() {
  try {
    console.log('🏗️ Starting MapPLUTO data population with GeoJSON for Brooklyn...');

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

    // Step 1: Fetch 100 high-value properties from Brooklyn
    console.log('📡 Step 1: Fetching MapPLUTO property data from NYC Open Data...');
    const apiUrl = 'https://data.cityofnewyork.us/resource/64uk-42ks.json';
    
    // Get 100 of the highest assessed properties in Brooklyn for better data quality
    const queryUrl = `${apiUrl}?borough=BK&$limit=100&$order=assesstot DESC&$where=assesstot > 0`;
    
    console.log(`🔗 Fetching from: ${queryUrl}`);
    
    const response = await fetch(queryUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No data received from API');
    }
    
    console.log(`📋 Processing ${data.length} properties...`);
    
    // Step 2: Fetch GeoJSON boundaries for tax lots
    console.log('🗺️ Step 2: Fetching tax lot boundaries from NYC Planning...');
    
    // NYC MapPLUTO GeoJSON endpoint (this may need to be updated based on current API)
    const geoJsonUrl = 'https://data.cityofnewyork.us/resource/64uk-42ks.geojson';
    const bblList = data.map(row => row.bbl).filter(bbl => bbl).join(',');
    
    let geoJsonData = [];
    
    try {
      // Try to fetch GeoJSON data with BBL filter
      const geoJsonQuery = `${geoJsonUrl}?borough=BK&$limit=100&$order=assesstot DESC&$where=assesstot > 0`;
      console.log(`🔗 GeoJSON URL: ${geoJsonQuery}`);
      
      const geoResponse = await fetch(geoJsonQuery);
      
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        console.log(`📍 Found ${geoData.features?.length || 0} GeoJSON features`);
        geoJsonData = geoData.features || [];
      } else {
        console.warn(`⚠️ GeoJSON fetch failed: ${geoResponse.status}, continuing without boundaries`);
      }
    } catch (error) {
      console.warn(`⚠️ Error fetching GeoJSON data: ${error.message}, continuing without boundaries`);
    }
    
    // Create a map of BBL to GeoJSON for quick lookup
    const bblToGeoJson = new Map();
    geoJsonData.forEach(feature => {
      if (feature.properties && feature.properties.bbl) {
        bblToGeoJson.set(feature.properties.bbl, feature);
      }
    });
    
    console.log(`🔍 Created GeoJSON lookup map with ${bblToGeoJson.size} entries`);
    
    // Step 3: Process and insert data with GeoJSON references
    const processedData = [];
    let geoJsonInsertCount = 0;
    
    for (const row of data) {
      try {
        // Clean and validate the data
        const cleanValue = (val) => {
          if (val === null || val === undefined || val === '' || val === 'null') return null;
          return val;
        };
        
        const cleanNumber = (val) => {
          if (val === null || val === undefined || val === '' || val === 'null') return null;
          const num = parseFloat(val);
          return isNaN(num) ? null : num;
        };
        
        const cleanInteger = (val) => {
          if (val === null || val === undefined || val === '' || val === 'null') return null;
          const num = parseInt(val);
          return isNaN(num) ? null : num;
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
        
        // Check if we have GeoJSON for this BBL
        let geojsonDataId = null;
        const bbl = cleanValue(row.bbl);
        
        if (bbl && bblToGeoJson.has(bbl)) {
          try {
            const geoFeature = bblToGeoJson.get(bbl);
            
            // Insert GeoJSON data first
            const geoJsonInsert = await client`
              INSERT INTO "GeoJSONData" (data, metadata)
              VALUES (
                ${JSON.stringify(geoFeature)},
                ${JSON.stringify({
                  type: 'mappluto_tax_lot',
                  bbl: bbl,
                  borough: 'Brooklyn',
                  source: 'NYC MapPLUTO',
                  address: address || `BBL ${bbl}`,
                  assesstot: cleanInteger(row.assesstot),
                  yearbuilt: cleanInteger(row.yearbuilt),
                  bldgclass: cleanValue(row.bldgclass),
                  landuse: cleanValue(row.landuse)
                })}
              )
              RETURNING id
            `;
            
            geojsonDataId = geoJsonInsert[0].id;
            geoJsonInsertCount++;
            console.log(`📍 Inserted GeoJSON for BBL ${bbl}`);
            
          } catch (error) {
            console.warn(`⚠️ Failed to insert GeoJSON for BBL ${bbl}:`, error.message);
          }
        }
        
        const processedRow = {
          // Property Identifiers
          bbl: bbl || '',
          borough: 'Brooklyn',
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
          
          // GeoJSON reference
          geojsonDataId: geojsonDataId,
        };
        
        // Only add if we have required data
        if (processedRow.bbl && processedRow.borough) {
          processedData.push(processedRow);
        }
        
      } catch (error) {
        console.warn(`⚠️ Error processing row for BBL ${row.bbl}:`, error.message);
      }
    }
    
    // Step 4: Insert property data
    if (processedData.length > 0) {
      console.log(`💾 Inserting ${processedData.length} valid properties...`);
      
      await client`
        INSERT INTO "NYCMapPLUTO" ${client(processedData, 
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
      
      console.log(`🎉 MapPLUTO population complete!`);
      console.log(`   📊 Properties inserted: ${processedData.length}`);
      console.log(`   🗺️ GeoJSON boundaries: ${geoJsonInsertCount}`);
      console.log(`   📍 Coverage: ${Math.round((geoJsonInsertCount / processedData.length) * 100)}%`);
    }
    
    // Show detailed statistics
    const stats = await client`
      SELECT 
        COUNT(*) as total_properties,
        COUNT(DISTINCT bldgclass) as unique_building_classes,
        COUNT(DISTINCT landuse) as unique_land_uses,
        COUNT("geojsonDataId") as properties_with_boundaries,
        AVG(assesstot) as avg_assessment,
        MIN(yearbuilt) as oldest_building,
        MAX(yearbuilt) as newest_building,
        AVG(lotarea) as avg_lot_area,
        MAX(assesstot) as max_assessment
      FROM "NYCMapPLUTO" 
      WHERE borough = 'Brooklyn' AND assesstot IS NOT NULL
    `;
    
    console.log('\n📊 Brooklyn MapPLUTO Statistics:');
    console.log(`   Total Properties: ${stats[0].total_properties}`);
    console.log(`   Properties with Boundaries: ${stats[0].properties_with_boundaries}`);
    console.log(`   Building Classes: ${stats[0].unique_building_classes}`);
    console.log(`   Land Use Types: ${stats[0].unique_land_uses}`);
    console.log(`   Avg Assessment: $${Math.round(stats[0].avg_assessment).toLocaleString()}`);
    console.log(`   Max Assessment: $${Math.round(stats[0].max_assessment).toLocaleString()}`);
    console.log(`   Building Years: ${stats[0].oldest_building} - ${stats[0].newest_building}`);
    console.log(`   Avg Lot Area: ${Math.round(stats[0].avg_lot_area)} sq ft`);
    
    // Show top building classes
    const topClasses = await client`
      SELECT bldgclass, COUNT(*) as count, AVG(assesstot) as avg_value
      FROM "NYCMapPLUTO" 
      WHERE borough = 'Brooklyn' AND bldgclass IS NOT NULL AND assesstot IS NOT NULL
      GROUP BY bldgclass
      ORDER BY count DESC
      LIMIT 10
    `;
    
    console.log('\n🏗️ Top Building Classes:');
    topClasses.forEach(cls => {
      console.log(`   ${cls.bldgclass}: ${cls.count} properties (avg: $${Math.round(cls.avg_value).toLocaleString()})`);
    });
    
    // Show sample high-value properties
    const sampleProperties = await client`
      SELECT bbl, address, bldgclass, landuse, assesstot, yearbuilt, 
             CASE WHEN "geojsonDataId" IS NOT NULL THEN 'Yes' ELSE 'No' END as has_boundary
      FROM "NYCMapPLUTO" 
      WHERE borough = 'Brooklyn' AND assesstot IS NOT NULL
      ORDER BY assesstot DESC
      LIMIT 5
    `;
    
    console.log('\n🏆 Sample High-Value Properties:');
    sampleProperties.forEach((prop, i) => {
      console.log(`   ${i+1}. BBL ${prop.bbl} - ${prop.address || 'No address'}`);
      console.log(`      Value: $${prop.assesstot.toLocaleString()} | Built: ${prop.yearbuilt || 'Unknown'} | Boundary: ${prop.has_boundary}`);
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
  populateMapPLUTOWithGeoJSON()
    .then(() => {
      console.log('\n✅ MapPLUTO population with GeoJSON completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ MapPLUTO population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateMapPLUTOWithGeoJSON };
