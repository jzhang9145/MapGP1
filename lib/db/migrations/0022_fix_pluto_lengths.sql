-- Align NYCMapPLUTO varchar lengths with application schema
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "areasource" TYPE varchar(5);
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "ext" TYPE varchar(5);
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "proxcode" TYPE varchar(5);
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "irrlotcode" TYPE varchar(10);
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "lottype" TYPE varchar(5);
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "bsmtcode" TYPE varchar(5);
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "ownertype" TYPE varchar(5);
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "zmcode" TYPE varchar(10);
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "plutomapid" TYPE varchar(10);
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "edesignum" TYPE varchar(10);
ALTER TABLE "NYCMapPLUTO" ALTER COLUMN "borocode" TYPE varchar(5);

