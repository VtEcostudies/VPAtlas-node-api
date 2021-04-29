DROP VIEW IF EXISTS "poolsGetOverview";
CREATE OR REPLACE VIEW "poolsGetOverview" AS
SELECT
  "townId",
  "townName",
  "countyName",
  "mappedPoolId" AS "poolId",
  "mappedPoolStatus" AS "poolStatus",
  SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
  SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
  "mappedPoolId" AS "poolId",
  "mappedPoolStatus" AS "poolStatus",
  "mappedByUser",
  "mappedMethod",
  "mappedConfidence",
  "mappedLocationUncertainty",
  --"mappedObserverUserId",
  vpmapped."updatedAt" AS "mappedUpdatedAt",
  "visitId",
  "visitPoolId",
  "visitUserName",
  "visitDate",
  "visitVernalPool",
  "visitLatitude",
  "visitLongitude",
  vpvisit."updatedAt" AS "visitUpdatedAt",
  "reviewId",
  "reviewQACode",
  "reviewPoolStatus",
  vpreview."updatedAt" AS "reviewUpdatedAt"
  FROM vpmapped
  LEFT JOIN vpvisit ON "visitPoolId"="mappedPoolId"
  LEFT JOIN vpreview ON "reviewPoolId"="mappedPoolId"
  LEFT JOIN vptown ON "mappedTownId"="townId"
  LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
  --LEFT JOIN vpuser ON "mappedByUserId"="id";

SELECT * FROM "poolsGetOverview"
WHERE "mappedUpdatedAt"<now()::timestamp
--AND "poolStatus"='Confirmed';
