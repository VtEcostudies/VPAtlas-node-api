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
*/
CREATE TABLE vpknown (
	"poolId" TEXT NOT NULL UNIQUE REFERENCES vpmapped("mappedPoolId"),
	"poolLocation" geometry(POINT, 4326) NOT NULL,  --EPSG:4326 is WGS84 is ...
	"poolStatus" POOLSTATUS NOT NULL,
	"knownTownId" INTEGER REFERENCES vptown("townId") DEFAULT 0,
	"sourceVisitId" INTEGER REFERENCES vpvisit("visitId") DEFAULT 0,
	"sourceSurveyId" INTEGER REFERENCES vpsurvey("surveyId") DEFAULT 0,
	"createdAt" TIMESTAMP DEFAULT NOW(),
	"updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON vpknown
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

--pre-populate known table with currently-known mapped pool data
TRUNCATE TABLE vpknown;

INSERT INTO vpknown SELECT
"mappedPoolId" AS "poolId",
ST_AsGeoJSON(ST_GeomFromText('POINT(' || "mappedLongitude" || ' ' || "mappedLatitude" || ')')) AS "poolLocation",
"mappedPoolStatus" AS "poolStatus"
FROM vpmapped;

--Update known table with the most recent visit data
UPDATE vpknown SET
"poolLocation" = ST_AsGeoJSON(ST_GeomFromText('POINT(' || "visitLongitude" || ' ' || "visitLatitude" || ')')),
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
