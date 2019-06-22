-- drop ENUM type methodmapped in preparation for re-importing the vpmapped data
-- and creating vpmapped pool from vpvisit data. NEW pools from vpvisit get a
-- mappedMethod value of 'Visit'.
ALTER TABLE vpmapped ALTER COLUMN  "mappedMethod" TYPE TEXT;
DROP TYPE IF EXISTS methodmapped;
-- we create this ENUM type but don't use/apply it to the column. gave up on
-- contraining data to normalized values. in the future, more methods may require
-- another such change. too much work.
--CREATE TYPE methodmapped AS ENUM ('Aerial', 'Known', 'Visit');

--fix lat/lon columns to retain 11 sig figs and 8 decimal values to match incoming data
ALTER TABLE vpmapped ALTER COLUMN "mappedLatitude" TYPE NUMERIC(11,8);
ALTER TABLE vpmapped ALTER COLUMN "mappedLongitude" TYPE NUMERIC(11,8);

-- delete all existing data from vpvisit.
-- we don't need to drop table because it does not have an autoincrement key to reset.
TRUNCATE TABLE vpmapped;

-- reload vpmapped from newly fixed-up import file 'vpMapped.20190607.csv'
-- lat and lon were truncated by column type real
-- had to fix-up CSV file for re-import. made columns NOT NULL, etc.
COPY vpmapped(
	"mappedPoolId",
	"mappedByUser",
	"mappedByUserId",
	"mappedDateText",
	"mappedDateUnixSeconds",
	"mappedLatitude",
	"mappedLongitude",
	"mappedConfidence",
	"mappedSource",
	"mappedSource2",
	"mappedPhotoNumber",
	"mappedLocationAccuracy",
	"mappedShape",
	"mappedComments",
	"createdAt",
	"updatedAt"        
)
FROM 'vpMapped.20190607.csv' DELIMITER ',' CSV HEADER;
--FROM 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\vpMapped\db.02\vpMapped.20190607.csv' DELIMITER ',' CSV HEADER;
--FROM '/home/ubuntu/VPAtlas-node-api/vpMapped/db.02/vpMapped.20190607.csv' DELIMITER ',' CSV HEADER;

UPDATE vpmapped SET "mappedPoolStatus"='Probable' WHERE "mappedPoolId" LIKE '%KWN%';

-- function to alter timestamp column 'updatedAt'
-- we create that column name in each table and re-use this function for each
-- trigger funtion below must be added to each table having 'updatedAt'
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_updated_at BEFORE UPDATE
    ON vpmapped FOR EACH ROW EXECUTE PROCEDURE 
    set_updated_at();

