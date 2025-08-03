CREATE TABLE IF NOT EXISTS "GeoJSONData" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data" json NOT NULL,
	"metadata" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Area" ADD COLUMN "geojsonDataId" uuid;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Area" ADD CONSTRAINT "Area_geojsonDataId_GeoJSONData_id_fk" FOREIGN KEY ("geojsonDataId") REFERENCES "public"."GeoJSONData"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Migrate existing geojson data to GeoJSONData table
DO $$
DECLARE
    area_record RECORD;
    geojson_id uuid;
BEGIN
    FOR area_record IN SELECT "chatId", "geojson", "createdAt", "updatedAt" FROM "Area" WHERE "geojson" IS NOT NULL
    LOOP
        INSERT INTO "GeoJSONData" ("id", "data", "metadata", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            area_record."geojson",
            json_build_object(
                'type', COALESCE(area_record."geojson"->>'type', 'unknown'),
                'size', length(area_record."geojson"::text),
                'migratedFrom', 'legacy_area_table',
                'migratedAt', now()
            ),
            area_record."createdAt",
            area_record."updatedAt"
        ) RETURNING "id" INTO geojson_id;
        
        UPDATE "Area" SET "geojsonDataId" = geojson_id WHERE "chatId" = area_record."chatId";
    END LOOP;
END $$;
--> statement-breakpoint
-- Make geojsonDataId NOT NULL after migration
ALTER TABLE "Area" ALTER COLUMN "geojsonDataId" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "Area" DROP COLUMN IF EXISTS "geojson";