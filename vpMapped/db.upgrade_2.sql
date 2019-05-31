/*
 * NOTE: this had to be done by hand - code that uses this file
 * depends upon the table to exist.
 * 
--Create a database version table to handle those
CREATE TABLE dbversion (
	"dbVersionId" INTEGER,
	"dbUpgradeFileName" TEXT,
	"dbUpgradeScript" TEXT,
	PRIMARY KEY ("dbVersionId")
);

INSERT INTO dbversion ("dbVersionId","dbUpgradeFileName") VALUES (1,'db.upgrade_1.sql');
*/
/*
Remove from Add Pool Form (db - make not required):
	Confidence
	Location Accuracy
	Photo Number
	Source
	source2
*/
ALTER TABLE vpmapped ALTER COLUMN "mappedConfidence" DROP NOT NULL;
ALTER TABLE vpmapped ALTER COLUMN "mappedLocationAccuracy" DROP NOT NULL;
ALTER TABLE vpmapped ALTER COLUMN "mappedSource" DROP NOT NULL;

/*
Add to Add Pool Form (db - add columns, etc.)
	Flag: aerial-mapped or not
	location info/directions
	Town (drop-down from a list in the db)
	landowner(name, unknown)
	location uncertainty: 50 yds, 100 yds, >100 yds

	Ability to drop pointer on the map
	Did you fill-out a vpVisit data sheet?
		If yes: goto vpVisit Add Pool form
*/

CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;
	
--create a table of Vermont Counties with PostGIS fields for centroid and border
CREATE TABLE vpcounty (
	"countyId" INTEGER NOT NULL,
	"govCountyId" INTEGER UNIQUE,
	"countyName" VARCHAR(50) NOT NULL,
	PRIMARY KEY ("countyId")
);
SELECT AddGeometryColumn('public', 'vpcounty', 'countyCentroid', -1, 'POINT', 2);
SELECT AddGeometryColumn('public', 'vpcounty', 'countyBorder', -1, 'MULTIPOLYGON', 2);
INSERT INTO vpcounty ("countyName", "countyId", "govCountyId") VALUES ('Unknown', 0, 0);

--create a table of Vermont Towns with PostGIS fields for centroid and border
--Since Towns are always within a County, create foreign reference to County
CREATE TABLE vptown (
	"townId" INTEGER NOT NULL,
	"townName" VARCHAR(50) NOT NULL,
	"townCountyId" INTEGER NOT NULL,
	PRIMARY KEY ("townId")
);
SELECT AddGeometryColumn('public', 'vptown', 'townCentroid', -1, 'POINT', 2);
SELECT AddGeometryColumn('public', 'vptown', 'townBorder', -1, 'MULTIPOLYGON', 2);
--ALTER TABLE vptown ADD CONSTRAINT "fk_county_id" FOREIGN KEY ("townCountyId") REFERENCES vpcounty ("countyId");
ALTER TABLE vptown ADD CONSTRAINT "fk_gov_county_id" FOREIGN KEY ("townCountyId") REFERENCES vpcounty ("govCountyId");
INSERT INTO vptown ("townName", "townId", "townCountyId") VALUES ('Unknown', 0, (SELECT "countyId" FROM vpcounty WHERE "countyName"='Unknown'));

--Create new fields for entering new pools as per conversation with Alex and Steve
--CREATE TYPE distanceunits AS ENUM ('Feet', 'Yards', 'Meters');
CREATE TYPE methodmapped AS ENUM ('Aerial/Potential', 'Known/Probable');
ALTER TABLE vpmapped ADD COLUMN "mappedMethod" mappedmethod;
ALTER TABLE vpmapped ADD COLUMN "mappedlocationInfoDirections" TEXT;
ALTER TABLE vpmapped ADD COLUMN "mappedLandownerKnown" BOOLEAN DEFAULT false;
ALTER TABLE vpmapped ADD COLUMN "mappedLandownerInfo" TEXT;
--ALTER TABLE vpmapped ADD COLUMN "mappedLocationUncertaintyUnits" distanceunits DEFAULT 'Yards';
ALTER TABLE vpmapped ADD COLUMN "mappedLocationUncertainty" INTEGER;
ALTER TABLE vpmapped ADD COLUMN "mappedTownId" INTEGER DEFAULT 0;
ALTER TABLE vpmapped ADD CONSTRAINT "fk_town_id" FOREIGN KEY ("mappedTownId") REFERENCES vptown ("townId");

--Create a PostGIS pool location for use with PostGIS spatial tools. For newly mapped pools
--a border will not be known. However, those values are stored here, not in vpVisit or vpMonitor.
SELECT AddGeometryColumn('public', 'vpmapped', 'mappedLocation', -1, 'POINT', 2);
SELECT AddGeometryColumn('public', 'vpmapped', 'mappedPoolBorder', -1, 'MULTIPOLYGON', 2);

UPDATE vpmapped SET "mappedPhotoNumber"=null WHERE "mappedPhotoNumber" = ' ';
UPDATE vpmapped SET "mappedMethod"='Known/Probable' WHERE "mappedPoolId" LIKE '%KWN%'
UPDATE vpmapped SET "mappedMethod"='Aerial/Potential' WHERE "mappedPoolId" NOT LIKE '%KWN%'

--all these were changed in create statements above, and were used during development
/*
ALTER TYPE mappedmethod RENAME TO methodmapped;

ALTER TABLE vpcounty ALTER COLUMN "countyId" TYPE INTEGER;
DROP SEQUENCE "vpcounty_countyId_seq" CASCADE;
ALTER TABLE vpcounty ADD COLUMN "govCountyId" INTEGER;

ALTER TABLE vpmapped DROP COLUMN "mappedLocationUncertaintyUnits";
DROP TYPE distanceunits;

ALTER TABLE vpcounty ADD CONSTRAINT gov_county_id_key UNIQUE ("govCountyId");
UPDATE vpcounty SET "govCountyId"=0 WHERE "countyId"=0;

ALTER TABLE vptown DROP CONSTRAINT "fk_county_id";
ALTER TABLE vptown ADD CONSTRAINT "fk_gov_county_id" FOREIGN KEY ("townCountyId") REFERENCES vpcounty ("govCountyId");

DROP SEQUENCE "vptown_townId_seq" CASCADE;
*/
