-- Restore MapPLUTO zoning columns expected by the app schema and tools
ALTER TABLE "NYCMapPLUTO" ADD COLUMN IF NOT EXISTS "zonedist1" varchar(12);
ALTER TABLE "NYCMapPLUTO" ADD COLUMN IF NOT EXISTS "zonedist2" varchar(12);
ALTER TABLE "NYCMapPLUTO" ADD COLUMN IF NOT EXISTS "zonedist3" varchar(12);
ALTER TABLE "NYCMapPLUTO" ADD COLUMN IF NOT EXISTS "zonedist4" varchar(12);

-- Optional: keep indexes lean; no index added for these lookup fields

