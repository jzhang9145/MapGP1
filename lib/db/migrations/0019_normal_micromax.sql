ALTER TABLE "NYCMapPLUTO" DROP CONSTRAINT "NYCMapPLUTO_bbl_unique";--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bbl" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "borough" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "block" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lot" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "borocode" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bldgclass" SET DATA TYPE varchar(2);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "landuse" SET DATA TYPE varchar(2);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lotarea" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bldgarea" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "comarea" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "resarea" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "officearea" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "retailarea" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "garagearea" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "strgearea" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "factryarea" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "otherarea" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "numbldgs" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "numfloors" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "unitsres" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "unitstotal" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lotfront" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lotdepth" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bldgfront" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bldgdepth" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "assessland" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "assesstot" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "exempttot" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "yearbuilt" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "yearalter1" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "yearalter2" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "builtfar" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "residfar" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "commfar" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "facilfar" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "cd" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "zipcode" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "zonemap" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "areasource" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "ext" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "proxcode" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "irrlotcode" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lottype" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bsmtcode" SET DATA TYPE varchar(1);--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "xcoord" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "ycoord" SET DATA TYPE integer;--> statement-breakpoint
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