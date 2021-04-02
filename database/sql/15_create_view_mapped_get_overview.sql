DROP VIEW IF EXISTS "mappedGetOverview";
CREATE OR REPLACE VIEW "mappedGetOverview" AS
SELECT
  vptown."townId",
  vptown."townName",
  vpcounty."countyName",
  vpknown."poolId",
  SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
  SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
  vpknown."poolStatus",
  vpknown."sourceVisitId",
  vpknown."sourceSurveyId",
  vpknown."updatedAt",
  vpmapped."mappedPoolId",
  vpmapped."mappedByUser",
  vpmapped."mappedMethod",
  vpmapped."mappedPoolStatus",
  vpmapped."mappedConfidence",
  vpmapped."mappedObserverUserName",
  vpmapped."mappedLandownerPermission",
  vpmapped."updatedAt" AS "mappedUpdatedAt"
  FROM vpknown
  INNER JOIN vpmapped ON "mappedPoolId"="poolId"
  LEFT JOIN vptown ON "knownTownId"="townId"
  LEFT JOIN vpcounty ON "govCountyId"="townCountyId";

SELECT * FROM "mappedGetOverview"
WHERE "updatedAt"<now()::timestamp
--AND "poolStatus"='Confirmed';
