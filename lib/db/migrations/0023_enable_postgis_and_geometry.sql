-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry columns to reference tables
ALTER TABLE "GeoJSONData" ADD COLUMN IF NOT EXISTS geom geometry;

-- Backfill simple polygon/multipolygon geometries from stored GeoJSON where possible
-- Note: Assumes SRID 4326 for all stored geometries
UPDATE "GeoJSONData"
SET geom =
  CASE
    WHEN (data->>'type') = 'Feature' THEN
      ST_SetSRID(ST_GeomFromGeoJSON(data->'geometry'), 4326)
    WHEN (data->>'type') IN ('Polygon','MultiPolygon','Point','MultiPoint','LineString','MultiLineString') THEN
      ST_SetSRID(ST_GeomFromGeoJSON(data), 4326)
    ELSE geom
  END
WHERE geom IS NULL;

-- Geometry columns for domain tables that reference GeoJSONData
ALTER TABLE "NYCNeighborhoods" ADD COLUMN IF NOT EXISTS geom geometry;
ALTER TABLE "NYCParks" ADD COLUMN IF NOT EXISTS geom geometry;
ALTER TABLE "NYCMapPLUTO" ADD COLUMN IF NOT EXISTS geom geometry;
ALTER TABLE "NYCSchoolZones" ADD COLUMN IF NOT EXISTS geom geometry;
ALTER TABLE "NYCCensusBlocks" ADD COLUMN IF NOT EXISTS geom geometry;

-- Backfill domain table geometry from their GeoJSON reference when available
UPDATE "NYCNeighborhoods" n
SET geom = g.geom
FROM "GeoJSONData" g
WHERE n."geojsonDataId" = g.id AND n.geom IS NULL AND g.geom IS NOT NULL;

UPDATE "NYCParks" p
SET geom = g.geom
FROM "GeoJSONData" g
WHERE p."geojsonDataId" = g.id AND p.geom IS NULL AND g.geom IS NOT NULL;

UPDATE "NYCMapPLUTO" m
SET geom = g.geom
FROM "GeoJSONData" g
WHERE m."geojsonDataId" = g.id AND m.geom IS NULL AND g.geom IS NOT NULL;

UPDATE "NYCSchoolZones" s
SET geom = g.geom
FROM "GeoJSONData" g
WHERE s."geojsonDataId" = g.id AND s.geom IS NULL AND g.geom IS NOT NULL;

UPDATE "NYCCensusBlocks" c
SET geom = g.geom
FROM "GeoJSONData" g
WHERE c."geojsonDataId" = g.id AND c.geom IS NULL AND g.geom IS NOT NULL;

-- Spatial indexes
CREATE INDEX IF NOT EXISTS geodata_geom_gix ON "GeoJSONData" USING GIST (geom);
CREATE INDEX IF NOT EXISTS neigh_geom_gix ON "NYCNeighborhoods" USING GIST (geom);
CREATE INDEX IF NOT EXISTS parks_geom_gix ON "NYCParks" USING GIST (geom);
CREATE INDEX IF NOT EXISTS pluto_geom_gix ON "NYCMapPLUTO" USING GIST (geom);
CREATE INDEX IF NOT EXISTS schools_geom_gix ON "NYCSchoolZones" USING GIST (geom);
CREATE INDEX IF NOT EXISTS census_geom_gix ON "NYCCensusBlocks" USING GIST (geom);


