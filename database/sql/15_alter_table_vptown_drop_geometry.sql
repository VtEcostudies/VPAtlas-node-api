ALTER TABLE vptown DROP COLUMN "townCentroid";
ALTER TABLE vptown DROP COLUMN "townBorder";

ALTER TABLE vptown ADD COLUMN "townAlias" TEXT;
UPDATE vptown SET "townName"='Saint Albans Town', "townAlias"='St. Albans Town' WHERE "townId"=25;
UPDATE vptown SET "townName"='Saint Albans City', "townAlias"='St. Albans City' WHERE "townId"=33;
UPDATE vptown SET "townName"='Saint Johnsbury', "townAlias"='St. Johnsbury' WHERE "townId"=75;
UPDATE vptown SET "townName"='Saint George', "townAlias"='St. George' WHERE "townId"=82;
UPDATE vptown SET "townName"='Rutland Town', "townAlias"='Rutland' WHERE "townId"=252;

select * from vptown
where "townName" LIKE '%Johnsbury%'
OR "townName" LIKE '%Rutland%'
OR "townName" LIKE '%Albans%'
OR "townName" LIKE '%George%';

ALTER TABLE vpmapped DROP COLUMN "mappedPoolStatus";
