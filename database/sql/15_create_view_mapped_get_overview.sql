DROP VIEW IF EXISTS "mappedGetOverview";
CREATE OR REPLACE VIEW "mappedGetOverview" AS
SELECT
  --vpknown."poolId",
  SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
  SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
  vpknown."poolStatus",
  vpknown."sourceVisitId",
  vpknown."sourceSurveyId",
  vpknown."updatedAt",
  vpmapped."mappedPoolId",
  vpmapped."mappedByUser",
  vpmapped."mappedMethod",
  vpmapped."mappedConfidence",
  vpmapped."mappedObserverUserName",
  vpmapped."mappedLandownerPermission",
  vpmapped."updatedAt" AS "mappedUpdatedAt",
  vptown.*
  FROM vpknown
  INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpknown."poolId"
  LEFT JOIN vptown ON vpmapped."mappedTownId"=vptown."townId";

SELECT * FROM "mappedGetOverview"
WHERE "updatedAt"<now()::timestamp
--AND "poolStatus"='Confirmed';
