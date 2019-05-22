--NOTE: if this script runs successfully, it cannot be run successfully again. if it fails without completing,
--you will have to modify it, possibly with other SQL statements, to fix any issues.
--fix bad data
UPDATE vpmapped SET "mappedComments" = "mappedComments" || ' - original mappedConfidence was ' || "mappedConfidence" WHERE "mappedConfidence" NOT IN ('L','ML','M','MH','H','UNK');
UPDATE vpmapped SET "mappedConfidence"='UNK' WHERE "mappedConfidence" NOT IN ('L','ML','M','MH','H','UNK');
UPDATE vpmapped SET "mappedComments" = "mappedComments" || ' - original mappedLocationAccuracy was ' || "mappedLocationAccuracy" WHERE "mappedLocationAccuracy" NOT IN ('L','ML','M','MH','H','UNK');
UPDATE vpmapped SET "mappedLocationAccuracy"='UNK' WHERE "mappedLocationAccuracy" NOT IN ('L','ML','M','MH','H','UNK');
--create new types
DROP TYPE IF EXISTS confidence;
DROP TYPE IF EXISTS locationaccuracy;
CREATE TYPE confidence AS ENUM ('L','ML','M','MH','H','UNK');
CREATE TYPE locationaccuracy AS ENUM ('L','ML','M','MH','H','UNK');
--alter columns to use types
ALTER TABLE vpmapped ALTER COLUMN "mappedConfidence" TYPE confidence  USING "mappedConfidence"::confidence;
ALTER TABLE vpmapped ALTER COLUMN "mappedLocationAccuracy" TYPE locationaccuracy USING "mappedLocationAccuracy"::locationaccuracy;
--once the types have been added to the table, you cannot rerun this script
ALTER TABLE vpmapped ALTER COLUMN "mappedConfidence" SET NOT NULL;
ALTER TABLE vpmapped ALTER COLUMN "mappedLocationAccuracy" SET NOT NULL;
