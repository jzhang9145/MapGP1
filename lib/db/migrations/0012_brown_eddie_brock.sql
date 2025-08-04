CREATE TABLE IF NOT EXISTS "NYCNeighborhoods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"borough" varchar(100) NOT NULL,
	"nta_code" varchar(50) NOT NULL,
	"nta_name" varchar(255) NOT NULL,
	"nta_2020" varchar(50) NOT NULL,
	"cdtca" varchar(50) NOT NULL,
	"cdtca_name" varchar(255) NOT NULL,
	"center_latitude" numeric(10, 8) NOT NULL,
	"center_longitude" numeric(11, 8) NOT NULL,
	"shape_area" varchar(50),
	"shape_leng" varchar(50),
	"geojsonDataId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "NYCNeighborhoods" ADD CONSTRAINT "NYCNeighborhoods_geojsonDataId_GeoJSONData_id_fk" FOREIGN KEY ("geojsonDataId") REFERENCES "public"."GeoJSONData"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
