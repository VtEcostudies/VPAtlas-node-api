--Create zero-values in foreign key tables so remote keys are optional (by using zero placeholder value).
INSERT INTO vpmapped
("mappedPoolId","mappedByUser","mappedDateText","mappedLatitude","mappedLongitude","mappedMethod","mappedPoolStatus")
	VALUES
('None', 'None', '1970-01-01', '0.0', '0.0', 'Known', 'Eliminated');

INSERT INTO vpvisit ("visitId","visitPoolId")
	VALUES
(0, 'None');

INSERT INTO vpsurvey ("surveyId","surveyPoolId","surveyTypeId","surveyUserId","surveyYear","surveyDateTime","surveyTownId")
	VALUES
(0, 'None', 9, 0, '1970', '1970-01-01', 0);

--DROP TABLE IF EXISTS vpknown;

/*
	Join table for known pool data.

  NOTES:
	Must create geometry with SRID to work with incoming geometry from eg. VCGIS.
	However, I did not experiment with *removing* SRID info from VCGIS data.

*/
CREATE TABLE vpknown (
	"poolId" TEXT NOT NULL UNIQUE REFERENCES vpmapped("mappedPoolId"),
	"poolLocation" geometry(POINT, 4326) NOT NULL,  --EPSG:4326 is WGS84 is ...
	"poolStatus" POOLSTATUS NOT NULL DEFAULT('Potential'),
	"knownTownId" INTEGER REFERENCES vptown("townId") DEFAULT 0,
	"sourceVisitId" INTEGER REFERENCES vpvisit("visitId") DEFAULT 0,
	"sourceSurveyId" INTEGER REFERENCES vpsurvey("surveyId") DEFAULT 0,
	"createdAt" TIMESTAMP DEFAULT NOW(),
	"updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON vpknown
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

--ALTER TABLE vpknown ALTER COLUMN "poolStatus" SET DEFAULT('Potential');

--TRUNCATE TABLE vpknown;

--pre-populate known table with currently-known mapped pool data
INSERT INTO vpknown SELECT
"mappedPoolId" AS "poolId",
ST_GeomFromText('POINT(' || "mappedLongitude" || ' ' || "mappedLatitude" || ')') AS "poolLocation",
"mappedPoolStatus" AS "poolStatus"
FROM vpmapped;

--Update known table with the most recent visit data
UPDATE vpknown SET
"poolLocation" = ST_GeomFromText('POINT(' || "visitLongitude" || ' ' || "visitLatitude" || ')'),
"sourceVisitId" = "visitId"
FROM vpvisit
WHERE "poolId"="visitPoolId"
AND "visitLongitude"::INTEGER != 0
AND "visitLatitude"::INTEGER != 0
AND "visitId" IN (
	SELECT MAX("visitId") AS "maxVisitId" FROM vpvisit
	GROUP BY "visitPoolId"
);

--Test query to show that MAX("visitId") Grouped By "visitPoolId" gets the latest visit to a pool
SELECT "cntVisitId","maxVisitId","visitId","visitPoolId"
FROM vpvisit LEFT JOIN (
	SELECT MAX("visitId") AS "maxVisitId", COUNT("visitId") AS "cntVisitId"
	FROM vpvisit
	GROUP BY "visitPoolId"
) as max
ON vpvisit."visitId"="maxVisitId"
ORDER BY "visitPoolId";

--ALTER TABLE vpmapped ADD COLUMN "mappedPoolStatus" POOLSTATUS DEFAULT 'Potential';
ALTER TABLE vpmapped ALTER COLUMN "mappedPoolStatus" SET DEFAULT 'Potential';

--DROP FUNCTION insert_vpknown_after_insert_vpmapped();

--create trigger function to insert vpknown row after vpmapped insert
--preserve the column mappedPoolStatus to enable this to be done easily
CREATE OR REPLACE FUNCTION insert_vpknown_after_insert_vpmapped()
    RETURNS trigger
	LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
   INSERT INTO vpknown ("poolId","poolLocation","poolStatus")
	 VALUES(
		NEW."mappedPoolId",
		ST_GEOMFROMTEXT('POINT(' || NEW."mappedLongitude" || ' ' ||  NEW."mappedLatitude" || ')', 4326),
	  	NEW."mappedPoolStatus"
	 );
   RETURN NEW;
END;
$BODY$;

ALTER FUNCTION insert_vpknown_after_insert_vpmapped()
    OWNER TO vpatlas;

--DROP TRIGGER trigger_insert_vpknown_after_insert_vpmapped ON vpmapped;

--create trigger to insert vpknown row before vpmapped insert
--preserve the column mappedPoolStatus to enable this to be done easily
CREATE TRIGGER trigger_insert_vpknown_after_insert_vpmapped
    AFTER INSERT
    ON vpmapped
    FOR EACH ROW
    EXECUTE PROCEDURE insert_vpknown_after_insert_vpmapped();

--create trigger to delete vpknown row before vpmapped delete
CREATE OR REPLACE FUNCTION delete_vpknown_before_delete_vpmapped()
    RETURNS trigger
	LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
   DELETE FROM vpknown WHERE "poolId"=NEW."mappedPoolId";
   RETURN NEW;
END;
$BODY$;

ALTER FUNCTION delete_vpknown_before_delete_vpmapped()
    OWNER TO vpatlas;

CREATE TRIGGER trigger_delete_vpknown_before_delete_vpmapped
    BEFORE DELETE
    ON vpmapped
    FOR EACH ROW
    EXECUTE PROCEDURE delete_vpknown_before_delete_vpmapped();
