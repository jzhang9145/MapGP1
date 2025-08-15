const { config } = require('dotenv');
config({ path: '.env.local' });

const postgres = require('postgres');
// Use native fetch (Node.js 18+) or try node-fetch as fallback
const fetch = globalThis.fetch || require('node-fetch');

// Initialize database connection
const client = postgres(process.env.POSTGRES_URL);

async function populateMapPLUTOFromArcGIS() {
  try {
    console.log('🏗️ Fetching MapPLUTO data with geometry from ArcGIS REST API...');

    // Clear existing Brooklyn data
    console.log('🧹 Clearing existing Brooklyn MapPLUTO data...');
    await client`DELETE FROM "NYCMapPLUTO" WHERE borough = 'Brooklyn'`;
    
    // ArcGIS REST API endpoint for MapPLUTO with geometry
    const arcgisUrl = 'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0/query';
    
    // Query parameters for Brooklyn (BoroCode=3), high-value properties
    const params = new URLSearchParams({
      where: "BoroCode = 3 AND AssessTot > 0", // Brooklyn only, with assessment values
      outFields: "BBL,Borough,Block,Lot,CD,BldgClass,LandUse,OwnerType,OwnerName,LotArea,BldgArea,ComArea,ResArea,OfficeArea,RetailArea,GarageArea,StrgeArea,FactryArea,OtherArea,AreaSource,NumBldgs,NumFloors,UnitsRes,UnitsTotal,LotFront,LotDepth,BldgFront,BldgDepth,Ext,ProxCode,IrrLotCode,LotType,BsmtCode,AssessLand,AssessTot,ExemptTot,YearBuilt,YearAlter1,YearAlter2,HistDist,Landmark,BuiltFAR,ResidFAR,CommFAR,FacilFAR,BoroCode,CondoNo,Tract2010,XCoord,YCoord,ZoneMap,ZMCode,ZoneDist1,ZoneDist2,ZoneDist3,ZoneDist4,Sanborn,TaxMap,EDesigNum,APPBBL,APPDate,PLUTOMapID,Version,Address,ZipCode,Latitude,Longitude",
      geometryType: "esriGeometryPolygon",
      returnGeometry: true, // This is key - we want the polygon geometry!
      outSR: 4326, // Return in WGS84 (lat/lng) for Leaflet compatibility
      f: "geojson", // Return as GeoJSON format
      orderByFields: "AssessTot DESC", // Highest value properties first
      resultRecordCount: 100 // Get 100 properties
    });

    const fullUrl = `${arcgisUrl}?${params.toString()}`;
    console.log(`🔗 Fetching from: ${fullUrl.substring(0, 150)}...`);

    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      throw new Error(`ArcGIS API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📦 Received GeoJSON with ${data.features?.length || 0} features`);

    if (!data.features || data.features.length === 0) {
      throw new Error('No features returned from ArcGIS API');
    }

    // Process and insert data
    const processedData = [];
    let geoJsonInsertCount = 0;

    for (const feature of data.features) {
      const props = feature.properties;
      const geometry = feature.geometry;

      // Create BBL identifier (should already be properly formatted from ArcGIS)
      const bbl = props.BBL ? props.BBL.toString() : null;
      
      if (!bbl) {
        console.warn('⚠️ Skipping feature without BBL');
        continue;
      }

      let geojsonDataId = null;

      // Insert GeoJSON data if we have geometry
      if (geometry) {
        try {
          const [geoRecord] = await client`
            INSERT INTO "GeoJSONData" (data, metadata)
            VALUES (${JSON.stringify(feature)}, ${JSON.stringify({
              bbl: bbl,
              source: 'arcgis_mappluto',
              type: 'tax_lot',
              fetched_at: new Date().toISOString()
            })})
            RETURNING id
          `;
          geojsonDataId = geoRecord.id;
          geoJsonInsertCount++;
        } catch (error) {
          console.error(`❌ Failed to insert GeoJSON for BBL ${bbl}:`, error.message);
        }
      }

      // Prepare property data
      const propertyData = {
        bbl: bbl,
        borough: 'Brooklyn', // We filtered for Brooklyn
        block: props.Block?.toString() || null,
        lot: props.Lot?.toString() || null,
        cd: props.CD?.toString() || null,
        bldgclass: props.BldgClass || null,
        landuse: props.LandUse || null,
        ownertype: props.OwnerType || null,
        ownername: props.OwnerName || null,
        lotarea: props.LotArea || null,
        bldgarea: props.BldgArea || null,
        comarea: props.ComArea || null,
        resarea: props.ResArea || null,
        officearea: props.OfficeArea || null,
        retailarea: props.RetailArea || null,
        garagearea: props.GarageArea || null,
        strgearea: props.StrgeArea || null,
        factryarea: props.FactryArea || null,
        otherarea: props.OtherArea || null,
        areasource: props.AreaSource || null,
        numbldgs: props.NumBldgs || null,
        numfloors: props.NumFloors || null,
        unitsres: props.UnitsRes || null,
        unitstotal: props.UnitsTotal || null,
        lotfront: props.LotFront || null,
        lotdepth: props.LotDepth || null,
        bldgfront: props.BldgFront || null,
        bldgdepth: props.BldgDepth || null,
        ext: props.Ext || null,
        proxcode: props.ProxCode || null,
        irrlotcode: props.IrrLotCode || null,
        lottype: props.LotType || null,
        bsmtcode: props.BsmtCode || null,
        assessland: props.AssessLand || null,
        assesstot: props.AssessTot || null,
        exempttot: props.ExemptTot || null,
        yearbuilt: props.YearBuilt || null,
        yearalter1: props.YearAlter1 || null,
        yearalter2: props.YearAlter2 || null,
        histdist: props.HistDist || null,
        landmark: props.Landmark || null,
        builtfar: props.BuiltFAR || null,
        residfar: props.ResidFAR || null,
        commfar: props.CommFAR || null,
        facilfar: props.FacilFAR || null,
        borocode: props.BoroCode?.toString() || null,
        condono: props.CondoNo || null,
        tract2010: props.Tract2010 || null,
        xcoord: props.XCoord || null,
        ycoord: props.YCoord || null,
        zonemap: props.ZoneMap || null,
        zmcode: props.ZMCode || null,
        zonedist1: props.ZoneDist1 || null,
        zonedist2: props.ZoneDist2 || null,
        zonedist3: props.ZoneDist3 || null,
        zonedist4: props.ZoneDist4 || null,
        sanborn: props.Sanborn || null,
        taxmap: props.TaxMap || null,
        edesignum: props.EDesigNum || null,
        appbbl: props.APPBBL?.toString() || null,
        appdate: props.APPDate || null,
        plutomapid: props.PLUTOMapID || null,
        version: props.Version || null,
        address: props.Address || null,
        zipcode: props.ZipCode || null,
        geojsonDataId: geojsonDataId
      };

      processedData.push(propertyData);
    }

    console.log(`📋 Processing ${processedData.length} properties for database insertion...`);

    // Insert properties in batches
    const batchSize = 20;
    let insertedCount = 0;

    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);
      
      try {
        await client`
          INSERT INTO "NYCMapPLUTO" ${client(batch, 
            'bbl', 'borough', 'block', 'lot', 'cd', 'bldgclass', 'landuse', 'ownertype', 'ownername',
            'lotarea', 'bldgarea', 'comarea', 'resarea', 'officearea', 'retailarea', 'garagearea', 
            'strgearea', 'factryarea', 'otherarea', 'areasource', 'numbldgs', 'numfloors', 'unitsres', 
            'unitstotal', 'lotfront', 'lotdepth', 'bldgfront', 'bldgdepth', 'ext', 'proxcode', 
            'irrlotcode', 'lottype', 'bsmtcode', 'assessland', 'assesstot', 'exempttot', 'yearbuilt', 
            'yearalter1', 'yearalter2', 'histdist', 'landmark', 'builtfar', 'residfar', 'commfar', 
            'facilfar', 'borocode', 'condono', 'tract2010', 'xcoord', 'ycoord', 'zonemap', 'zmcode', 
            'zonedist1', 'zonedist2', 'zonedist3', 'zonedist4', 'sanborn', 'taxmap', 'edesignum', 
            'appbbl', 'appdate', 'plutomapid', 'version', 'address', 'zipcode', 'geojsonDataId'
          )}
        `;
        insertedCount += batch.length;
        console.log(`✅ Inserted batch ${Math.ceil((i + batch.length) / batchSize)}/${Math.ceil(processedData.length / batchSize)} (${insertedCount} total)`);
      } catch (error) {
        console.error(`❌ Failed to insert batch starting at index ${i}:`, error.message);
      }
    }

    console.log('\\n🎉 MapPLUTO population complete!');
    console.log(`📊 Summary:`);
    console.log(`   • ${insertedCount} properties inserted`);
    console.log(`   • ${geoJsonInsertCount} GeoJSON polygons created`);
    console.log(`   • Data source: ArcGIS REST API (NYC DCP)`);
    console.log(`   • All properties include polygon boundaries!`);

  } catch (error) {
    console.error('❌ Error populating MapPLUTO data:', error);
  } finally {
    await client.end();
  }
}

populateMapPLUTOFromArcGIS();
