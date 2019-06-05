/*
Add to Create/Update Pool Form:
	mappedLandownerPermisssion
	mappedLandowner
	mappedLandowner
	mappedLandowner
	...
*/
ALTER TABLE vpmapped RENAME COLUMN "mappedLandownerKnown" TO "mappedLandownerPermission";
ALTER TABLE vpmapped RENAME COLUMN "vpMappedLocation" TO "mappedPoolLocation";
ALTER TABLE vpmapped RENAME COLUMN "vpMappedPoolBorder" TO "mappedPoolBorder";

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

