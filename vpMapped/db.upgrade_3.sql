--NOTE: DON'T USE BACKSLASH COMMENTS IN THESE SCRIPTS. IT CAUSES ERRORS.
ALTER TABLE vpmapped RENAME COLUMN "mappedLandownerKnown" TO "mappedLandownerPermission";
--the following only applied to the dev env. prod was already correct.
--ALTER TABLE vpmapped RENAME COLUMN "mappedLocation" TO "mappedPoolLocation";
--ALTER TABLE vpmapped RENAME COLUMN "mappedBorder" TO "mappedPoolBorder";

ALTER TABLE vpmapped ADD COLUMN "mappedLandownerName" TEXT;
ALTER TABLE vpmapped ADD COLUMN "mappedLandownerAddress" TEXT;
ALTER TABLE vpmapped ADD COLUMN "mappedLandownerTown" TEXT;
ALTER TABLE vpmapped ADD COLUMN "mappedLandownerStateAbbrev" VARCHAR(2);
ALTER TABLE vpmapped ADD COLUMN "mappedLandownerZip5" INTEGER;
ALTER TABLE vpmapped ADD COLUMN "mappedLandownerPhone" TEXT;
ALTER TABLE vpmapped ADD COLUMN "mappedLandownerEmail" TEXT;

ALTER TABLE vpmapped ALTER COLUMN "mappedLocationUncertainty" TYPE TEXT;

CREATE TYPE poolStatus AS ENUM ('Potential', 'Probable', 'Confirmed', 'Eliminated', 'Duplicate');
ALTER TABLE vpmapped ADD COLUMN "mappedPoolStatus" poolStatus DEFAULT 'Potential';
UPDATE vpmapped SET "mappedPoolStatus"='Probable' WHERE "mappedPoolId" LIKE '%KWN%';

--the following only applied to the dev env. prod was already correct.
--ALTER TABLE vpcounty RENAME COLUMN "vpCountyCentroid" TO "countyCentroid";
--ALTER TABLE vpcounty RENAME COLUMN "vpCountyBorder" TO "countyBorder";
--ALTER TABLE vptown RENAME COLUMN "vpTownCentroid" TO "townCentroid";
--ALTER TABLE vptown RENAME COLUMN "vpTownBorder" TO "townBorder";
