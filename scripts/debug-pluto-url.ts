import { getGeoJSONDataById, searchNYCNeighborhoods } from '@/lib/db/queries';

async function main() {
  const name = process.argv[2] || 'Park Slope';
  const limit = Number(process.argv[3] || 200);
  const neighborhoods = await searchNYCNeighborhoods({ searchTerm: name });
  if (!neighborhoods?.length) {
    console.error('No neighborhoods found for', name);
    process.exit(1);
  }
  const n = neighborhoods[0];
  if (!n.geojsonDataId) {
    console.error('No geojsonDataId for', n.name);
    process.exit(1);
  }
  const gAny = (await getGeoJSONDataById({ id: n.geojsonDataId })) as any;
  const data = Array.isArray(gAny) ? gAny[0]?.data : gAny?.data;
  if (!data?.coordinates) {
    console.error('No coordinates for', n.name);
    process.exit(1);
  }
  const poly = data.type === 'Polygon' ? data.coordinates : data.coordinates[0];

  // Build Esri polygon geometry
  const geometryJSON = JSON.stringify({
    rings: poly,
    spatialReference: { wkid: 4326 },
  });
  const geometryEncoded = encodeURIComponent(geometryJSON);

  const base =
    'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MapPLUTO/FeatureServer/0/query';
  const params = new URLSearchParams({
    where: '1=1',
    geometry: geometryEncoded,
    geometryType: 'esriGeometryPolygon',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
    resultRecordCount: String(limit),
    orderByFields: 'OBJECTID',
  });

  const url = `${base}?${params.toString()}`;
  console.log('Neighborhood:', n.name, n.borough);
  console.log('Polygon rings:', poly.length);
  console.log('URL:', url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
