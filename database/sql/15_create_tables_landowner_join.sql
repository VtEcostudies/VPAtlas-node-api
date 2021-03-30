DROP TABLE IF EXISTS vplandowner_pool; --join table
DROP TABLE IF EXISTS vplandowner; --primary table

/*
	Landowner table to be used by VPMap, VPVisit, VPSurvey

  NOTES:
*/
CREATE TABLE vplandowner (
	"landownerId" SERIAL UNIQUE,
	"landownerName" TEXT,
	"landownerAddress" TEXT,
	"landownerTownId" INTEGER REFERENCES vptown("townId"),
	"landownerStateAbbrev" CHARACTER VARYING(2),
	"landownerZip5" TEXT,
	"landownerPhone" TEXT,
	"landownerEmail" TEXT,
	"landownerInfo" TEXT
);

/*
	Join table associating landowners with pools for dates

  NOTES: We handle historical changes in landowners by filing them with a
	datestamp. The current landowner is just MAX(landownderPoolDate)
*/
CREATE TABLE vplandowner_pool (
	"landownerPoolId" TEXT NOT NULL REFERENCES vpmapped("mappedPoolId"),
	"poolLandownerId" INTEGER NOT NULL REFERENCES vplandowner("landownerId"),
	"landownerPoolDate" DATE NOT NULL,
  CONSTRAINT "vplandowner_pool_date_unique" UNIQUE("landownerPoolId", "poolLandownerId", "landownerPoolDate")
);

TRUNCATE TABLE vplandowner CASCADE;

--INSERT landowner data from vpmapped, where it's stored as columns.
INSERT INTO vplandowner
("landownerName",
"landownerAddress",
"landownerTownId",
"landownerStateAbbrev",
"landownerZip5",
"landownerPhone",
"landownerEmail",
"landownerInfo")
(SELECT
"mappedLandownerName",
"mappedLandownerAddress",
"townId",
"mappedLandownerStateAbbrev",
"mappedLandownerZip5",
"mappedLandownerPhone",
"mappedLandownerEmail",
"mappedLandownerInfo"
FROM vpmapped
LEFT JOIN vptown ON LOWER("townName")=LOWER("mappedLandownerTown")
WHERE "mappedLandownerName" IS NOT NULL);

--Query vpvisit landowner data to understand what's there
SELECT
replace(("visitLandowner"->'visitLandownerName')::text, '"', '') AS "visitLandownerName",
replace(("visitLandowner"->'visitLandownerEmail')::text, '"', '') AS "visitLandownerEmail",
replace(("visitLandowner"->'visitLandownerPhone')::text, '"', '') AS "visitLandownerPhone",
replace(("visitLandowner"->'visitLandownerAddress')::text, '"', '') AS "visitLandownerAddress",
"visitLandowner",
"visitPoolId",
"visitId"
FROM vpvisit WHERE "visitLandowner" IS NOT NULL
AND "visitLandowner" != '{"disabled":true}';

--INSERT landowner data from vpvisit, where it's stored as JSONB.
INSERT INTO vplandowner
("landownerName",
"landownerAddress",
"landownerPhone",
"landownerEmail")
(SELECT
replace(("visitLandowner"->'visitLandownerName')::text, '"', '') AS "visitLandownerName",
replace(("visitLandowner"->'visitLandownerEmail')::text, '"', '') AS "visitLandownerEmail",
replace(("visitLandowner"->'visitLandownerPhone')::text, '"', '') AS "visitLandownerPhone",
replace(("visitLandowner"->'visitLandownerAddress')::text, '"', '') AS "visitLandownerAddress"
FROM vpvisit
WHERE "visitLandowner" IS NOT NULL
AND "visitLandowner" != '{"disabled":true}');

SELECT * FROM vplandowner;

/*
	Query to get current landowner by pool
*/
SELECT * FROM vplandowner
INNER JOIN vplandowner_pool ON "poolLandownerId"="landownerId"
INNER JOIN (
	SELECT MAX("landownerPoolDate"),"poolLandownerId"
	FROM vplandowner_pool
	GROUP BY "poolLandownerId"
) AS max_l ON max_l."poolLandownerId"="landownerId"
--WHERE "landownerPoolId"='';
