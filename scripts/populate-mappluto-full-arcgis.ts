import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

type Feature = {
  type: 'Feature';
  geometry: any;
  properties: Record<string, any>;
};

const ARCGIS_URL =
  'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0/query';

const BOROS: Array<{ code: number; name: string; borough: string }> = [
  { code: 1, name: 'Manhattan', borough: 'Manhattan' },
  { code: 2, name: 'Bronx', borough: 'Bronx' },
  { code: 3, name: 'Brooklyn', borough: 'Brooklyn' },
  { code: 4, name: 'Queens', borough: 'Queens' },
  { code: 5, name: 'Staten Island', borough: 'Staten Island' },
];

async function fetchPage(boroCode: number, offset: number, pageSize: number) {
  const params = new URLSearchParams({
    where: `BoroCode = ${boroCode} AND AssessTot >= 0`,
    outFields:
      'BBL,Borough,Block,Lot,CD,BldgClass,LandUse,OwnerType,OwnerName,LotArea,BldgArea,ComArea,ResArea,OfficeArea,RetailArea,GarageArea,StrgeArea,FactryArea,OtherArea,AreaSource,NumBldgs,NumFloors,UnitsRes,UnitsTotal,LotFront,LotDepth,BldgFront,BldgDepth,Ext,ProxCode,IrrLotCode,LotType,BsmtCode,AssessLand,AssessTot,ExemptTot,YearBuilt,YearAlter1,YearAlter2,HistDist,Landmark,BuiltFAR,ResidFAR,CommFAR,FacilFAR,BoroCode,CondoNo,Tract2010,XCoord,YCoord,ZoneMap,ZMCode,ZoneDist1,ZoneDist2,ZoneDist3,ZoneDist4,Sanborn,TaxMap,EDesigNum,APPBBL,APPDate,PLUTOMapID,Version,Address,ZipCode,Latitude,Longitude',
    geometryType: 'esriGeometryPolygon',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
    resultRecordCount: String(pageSize),
    resultOffset: String(offset),
  });

  const url = `${ARCGIS_URL}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS request failed: ${res.status}`);
  const data = (await res.json()) as { features?: Feature[] };
  return data.features ?? [];
}

function toPropertyRow(feature: Feature, borough: string) {
  const p = feature.properties || {};
  const bbl = p.BBL ? String(p.BBL) : null;
  return {
    bbl,
    borough,
    block: p.Block ? String(p.Block) : null,
    lot: p.Lot ? String(p.Lot) : null,
    cd: p.CD ? String(p.CD) : null,
    bldgclass: p.BldgClass ?? null,
    landuse: p.LandUse ?? null,
    ownertype: p.OwnerType ?? null,
    ownername: p.OwnerName ?? null,
    lotarea: p.LotArea ?? null,
    bldgarea: p.BldgArea ?? null,
    comarea: p.ComArea ?? null,
    resarea: p.ResArea ?? null,
    officearea: p.OfficeArea ?? null,
    retailarea: p.RetailArea ?? null,
    garagearea: p.GarageArea ?? null,
    strgearea: p.StrgeArea ?? null,
    factryarea: p.FactryArea ?? null,
    otherarea: p.OtherArea ?? null,
    areasource: p.AreaSource ?? null,
    numbldgs: p.NumBldgs ?? null,
    numfloors: p.NumFloors ?? null,
    unitsres: p.UnitsRes ?? null,
    unitstotal: p.UnitsTotal ?? null,
    lotfront: p.LotFront ?? null,
    lotdepth: p.LotDepth ?? null,
    bldgfront: p.BldgFront ?? null,
    bldgdepth: p.BldgDepth ?? null,
    ext: p.Ext ?? null,
    proxcode: p.ProxCode ?? null,
    irrlotcode: p.IrrLotCode ?? null,
    lottype: p.LotType ?? null,
    bsmtcode: p.BsmtCode ?? null,
    assessland: p.AssessLand ?? null,
    assesstot: p.AssessTot ?? null,
    exempttot: p.ExemptTot ?? null,
    yearbuilt: p.YearBuilt ?? null,
    yearalter1: p.YearAlter1 ?? null,
    yearalter2: p.YearAlter2 ?? null,
    histdist: p.HistDist ?? null,
    landmark: p.Landmark ?? null,
    builtfar: p.BuiltFAR ?? null,
    residfar: p.ResidFAR ?? null,
    commfar: p.CommFAR ?? null,
    facilfar: p.FacilFAR ?? null,
    borocode: p.BoroCode ? String(p.BoroCode) : null,
    condono: p.CondoNo ?? null,
    tract2010: p.Tract2010 ?? null,
    xcoord: p.XCoord ?? null,
    ycoord: p.YCoord ?? null,
    zonemap: p.ZoneMap ?? null,
    zmcode: p.ZMCode ?? null,
    zonedist1: p.ZoneDist1 ?? null,
    zonedist2: p.ZoneDist2 ?? null,
    zonedist3: p.ZoneDist3 ?? null,
    zonedist4: p.ZoneDist4 ?? null,
    sanborn: p.Sanborn ?? null,
    taxmap: p.TaxMap ?? null,
    edesignum: p.EDesigNum ?? null,
    appbbl: p.APPBBL ? String(p.APPBBL) : null,
    appdate: p.APPDate ?? null,
    plutomapid: p.PLUTOMapID ?? null,
    version: p.Version ?? null,
    address: p.Address ?? null,
    zipcode: p.ZipCode ?? null,
  } as const;
}

async function main() {
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL not set');
  const sql = postgres(process.env.POSTGRES_URL, { max: 1 });

  const args = process.argv.slice(2);
  const target =
    args.find((a) => a.startsWith('--borough='))?.split('=')[1] ?? 'all';
  const boros =
    target === 'all'
      ? BOROS
      : BOROS.filter((b) => b.name.toLowerCase() === target.toLowerCase());
  const pageSize = 2000;

  for (const b of boros) {
    console.log(`\n🏙️ Importing MapPLUTO for ${b.name}...`);
    // Optional: clear existing rows for this borough
    await sql`DELETE FROM "NYCMapPLUTO" WHERE borough = ${b.borough}`;

    let offset = 0;
    let totalInserted = 0;
    let totalGeo = 0;

    while (true) {
      const features = await fetchPage(b.code, offset, pageSize);
      if (features.length === 0) break;

      const rows: any[] = [];
      const geoInserts: Array<{ data: any; metadata: any }> = [];

      for (const f of features) {
        const row = toPropertyRow(f, b.borough);
        if (!row.bbl) continue;

        if (f.geometry) {
          geoInserts.push({
            data: f,
            metadata: {
              source: 'arcgis_mappluto',
              bbl: row.bbl,
              borough: b.borough,
              fetched_at: new Date().toISOString(),
            },
          });
        }

        rows.push(row);
      }

      // Insert GeoJSONData, get ids map by bbl
      const geoIds: Record<string, string> = {};
      if (geoInserts.length > 0) {
        const inserted = await sql<{ id: string; metadata: any }[]>`
          INSERT INTO "GeoJSONData" ${sql(
            geoInserts.map((g) => ({ data: g.data, metadata: g.metadata })),
            'data',
            'metadata',
          )} RETURNING id, metadata
        `;
        inserted.forEach((r) => {
          const bbl = r.metadata?.bbl;
          if (bbl) geoIds[bbl] = r.id;
        });
        totalGeo += inserted.length;
      }

      // Attach geojsonDataId and insert properties in batches
      const batches: any[] = [];
      for (const r of rows) {
        const geojsonDataId = geoIds[r.bbl as string] ?? null;
        batches.push({ ...r, geojsonDataId });
      }

      if (batches.length > 0) {
        await sql`
          INSERT INTO "NYCMapPLUTO" ${sql(
            batches,
            'bbl',
            'borough',
            'block',
            'lot',
            'cd',
            'bldgclass',
            'landuse',
            'ownertype',
            'ownername',
            'lotarea',
            'bldgarea',
            'comarea',
            'resarea',
            'officearea',
            'retailarea',
            'garagearea',
            'strgearea',
            'factryarea',
            'otherarea',
            'areasource',
            'numbldgs',
            'numfloors',
            'unitsres',
            'unitstotal',
            'lotfront',
            'lotdepth',
            'bldgfront',
            'bldgdepth',
            'ext',
            'proxcode',
            'irrlotcode',
            'lottype',
            'bsmtcode',
            'assessland',
            'assesstot',
            'exempttot',
            'yearbuilt',
            'yearalter1',
            'yearalter2',
            'histdist',
            'landmark',
            'builtfar',
            'residfar',
            'commfar',
            'facilfar',
            'borocode',
            'condono',
            'tract2010',
            'xcoord',
            'ycoord',
            'zonemap',
            'zmcode',
            'zonedist1',
            'zonedist2',
            'zonedist3',
            'zonedist4',
            'sanborn',
            'taxmap',
            'edesignum',
            'appbbl',
            'appdate',
            'plutomapid',
            'version',
            'address',
            'zipcode',
            'geojsonDataId',
          )}
        `;
        totalInserted += batches.length;
      }

      console.log(
        `   • inserted ${totalInserted} rows (${totalGeo} geojson) [offset ${offset}]`,
      );
      offset += features.length;
    }

    console.log(
      `✅ ${b.name}: ${totalInserted} properties, ${totalGeo} geometries`,
    );
  }

  await sql.end();
}

main().catch((err) => {
  console.error('❌ Failed to populate MapPLUTO fully:', err);
  process.exit(1);
});
