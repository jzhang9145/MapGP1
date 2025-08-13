CREATE TABLE IF NOT EXISTS "NYCParks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gispropnum" varchar(50),
	"name" varchar(255),
	"signname" varchar(255),
	"borough" varchar(50),
	"borocode" varchar(2),
	"communityboard" varchar(10),
	"councildistrict" varchar(10),
	"policepreinct" varchar(10),
	"assemblydistrict" varchar(10),
	"congressionaldistrict" varchar(10),
	"senateDistrict" varchar(10),
	"zipcode" varchar(20),
	"address" varchar(500),
	"acreage" varchar(20),
	"typecategory" varchar(100),
	"landuse" varchar(100),
	"department" varchar(100),
	"jurisdiction" varchar(100),
	"retired" varchar(10),
	"waterfront" varchar(10),
	"geojsonDataId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "NYCParks" ADD CONSTRAINT "NYCParks_geojsonDataId_GeoJSONData_id_fk" FOREIGN KEY ("geojsonDataId") REFERENCES "public"."GeoJSONData"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
