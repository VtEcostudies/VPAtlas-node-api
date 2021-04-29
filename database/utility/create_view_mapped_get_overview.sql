DROP VIEW IF EXISTS "mappedGetOverview";
CREATE OR REPLACE VIEW "mappedGetOverview" AS
SELECT
  "townId",
  "townName",
  "countyName",
  "mappedPoolId" AS "poolId",
  "mappedPoolStatus" AS "poolStatus",
  SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
  SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
  "mappedByUser",
  "mappedMethod",
  "mappedConfidence",
  "mappedObserverUserName",
  "mappedLandownerPermission",
  "updatedAt" AS "mappedUpdatedAt"
  FROM vpmapped
  LEFT JOIN vptown ON "mappedTownId"="townId"
  LEFT JOIN vpcounty ON "govCountyId"="townCountyId";

SELECT * FROM "mappedGetOverview"
WHERE "mappedUpdatedAt"<now()::timestamp
--AND "poolStatus"='Confirmed';
