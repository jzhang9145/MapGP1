CREATE TABLE IF NOT EXISTS "NYCCensusBlocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"geoid" varchar(15) NOT NULL,
	"dataYear" integer DEFAULT 2023 NOT NULL,
	"state" varchar(2) NOT NULL,
	"county" varchar(3) NOT NULL,
	"tract" varchar(6) NOT NULL,
	"block" varchar(4) NOT NULL,
	"totalPopulation" integer,
	"totalHouseholds" integer,
	"occupiedHouseholds" integer,
	"vacantHouseholds" integer,
	"medianHouseholdIncome" integer,
	"totalHousingUnits" integer,
	"ownerOccupied" integer,
	"renterOccupied" integer,
	"medianAge" numeric(5, 2),
	"whiteAlone" integer,
	"blackAlone" integer,
	"asianAlone" integer,
	"hispanicLatino" integer,
	"bachelorsOrHigher" integer,
	"unemploymentRate" numeric(5, 2),
	"borough" varchar(50) DEFAULT 'Brooklyn' NOT NULL,
	"geojsonDataId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "NYCCensusBlocks_geoid_dataYear_unique" UNIQUE("geoid","dataYear")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "NYCCensusBlocks" ADD CONSTRAINT "NYCCensusBlocks_geojsonDataId_GeoJSONData_id_fk" FOREIGN KEY ("geojsonDataId") REFERENCES "public"."GeoJSONData"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
