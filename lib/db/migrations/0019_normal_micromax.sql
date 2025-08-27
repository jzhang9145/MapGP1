ALTER TABLE "NYCMapPLUTO" DROP CONSTRAINT "NYCMapPLUTO_bbl_unique";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bbl" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "borough" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "block" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lot" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "borocode" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bldgclass" SET DATA TYPE varchar(2);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "landuse" SET DATA TYPE varchar(2);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lotarea" TYPE integer USING NULLIF(regexp_replace("lotarea", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bldgarea" TYPE integer USING NULLIF(regexp_replace("bldgarea", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "comarea" TYPE integer USING NULLIF(regexp_replace("comarea", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "resarea" TYPE integer USING NULLIF(regexp_replace("resarea", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "officearea" TYPE integer USING NULLIF(regexp_replace("officearea", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "retailarea" TYPE integer USING NULLIF(regexp_replace("retailarea", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "garagearea" TYPE integer USING NULLIF(regexp_replace("garagearea", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "strgearea" TYPE integer USING NULLIF(regexp_replace("strgearea", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "factryarea" TYPE integer USING NULLIF(regexp_replace("factryarea", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "otherarea" TYPE integer USING NULLIF(regexp_replace("otherarea", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "numbldgs" TYPE integer USING NULLIF(regexp_replace("numbldgs", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "numfloors" TYPE numeric USING NULLIF(regexp_replace("numfloors", '[^0-9.-]', '', 'g'), '')::numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "unitsres" TYPE integer USING NULLIF(regexp_replace("unitsres", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "unitstotal" TYPE integer USING NULLIF(regexp_replace("unitstotal", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lotfront" TYPE numeric USING NULLIF(regexp_replace("lotfront", '[^0-9.-]', '', 'g'), '')::numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lotdepth" TYPE numeric USING NULLIF(regexp_replace("lotdepth", '[^0-9.-]', '', 'g'), '')::numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bldgfront" TYPE numeric USING NULLIF(regexp_replace("bldgfront", '[^0-9.-]', '', 'g'), '')::numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bldgdepth" TYPE numeric USING NULLIF(regexp_replace("bldgdepth", '[^0-9.-]', '', 'g'), '')::numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "assessland" TYPE bigint USING NULLIF(regexp_replace("assessland", '[^0-9.-]', '', 'g'), '')::bigint;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "assesstot" TYPE bigint USING NULLIF(regexp_replace("assesstot", '[^0-9.-]', '', 'g'), '')::bigint;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "exempttot" TYPE bigint USING NULLIF(regexp_replace("exempttot", '[^0-9.-]', '', 'g'), '')::bigint;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "yearbuilt" TYPE integer USING NULLIF(regexp_replace("yearbuilt", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "yearalter1" TYPE integer USING NULLIF(regexp_replace("yearalter1", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "yearalter2" TYPE integer USING NULLIF(regexp_replace("yearalter2", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "builtfar" TYPE numeric USING NULLIF(regexp_replace("builtfar", '[^0-9.-]', '', 'g'), '')::numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "residfar" TYPE numeric USING NULLIF(regexp_replace("residfar", '[^0-9.-]', '', 'g'), '')::numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "commfar" TYPE numeric USING NULLIF(regexp_replace("commfar", '[^0-9.-]', '', 'g'), '')::numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "facilfar" TYPE numeric USING NULLIF(regexp_replace("facilfar", '[^0-9.-]', '', 'g'), '')::numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "cd" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "zipcode" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "zonemap" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "areasource" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "ext" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "proxcode" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "irrlotcode" TYPE varchar(1) USING CASE WHEN "irrlotcode" IS NULL THEN NULL WHEN "irrlotcode" THEN '1' ELSE '0' END;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lottype" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bsmtcode" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "xcoord" TYPE integer USING NULLIF(regexp_replace("xcoord", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "ycoord" TYPE integer USING NULLIF(regexp_replace("ycoord", '[^0-9.-]', '', 'g'), '')::integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "tract2010" SET DATA TYPE varchar(6);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "sanborn" SET DATA TYPE varchar(8);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "taxmap" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "plutomapid" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ADD COLUMN "ownertype" varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ADD COLUMN "histdist" varchar(50);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ADD COLUMN "landmark" varchar(50);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ADD COLUMN "condono" varchar(4);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ADD COLUMN "zmcode" varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ADD COLUMN "edesignum" varchar(10);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ADD COLUMN "appbbl" varchar(10);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ADD COLUMN "appdate" varchar(10);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mappluto_bbl_idx" ON "NYCMapPLUTO" USING btree ("bbl");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mappluto_borough_idx" ON "NYCMapPLUTO" USING btree ("borough");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mappluto_bldgclass_idx" ON "NYCMapPLUTO" USING btree ("bldgclass");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mappluto_landuse_idx" ON "NYCMapPLUTO" USING btree ("landuse");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mappluto_assessment_idx" ON "NYCMapPLUTO" USING btree ("assesstot");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mappluto_yearbuilt_idx" ON "NYCMapPLUTO" USING btree ("yearbuilt");--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "ct2010";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "cb2010";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "schooldist";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "council";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "firecomp";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "policeprct";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "healtharea";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "sanitboro";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "sanitsub";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "zonedist1";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "overlay1";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "splitzone";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "latitude";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "longitude";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "bct2020";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "bctcb2020";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "sanitdistrict";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "healthcenterdistrict";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" DROP COLUMN IF EXISTS "easements";