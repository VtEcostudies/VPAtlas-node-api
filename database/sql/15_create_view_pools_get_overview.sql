DROP VIEW IF EXISTS "poolsGetOverview";
CREATE OR REPLACE VIEW "poolsGetOverview" AS
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
  vpmapped."mappedByUser",
  vpmapped."mappedMethod",
  vpmapped."mappedConfidence",
  vpmapped."mappedLocationUncertainty",
  --vpmapped."mappedObserverUserName",
  vpmapped."updatedAt" AS "mappedUpdatedAt",
  vpvisit."visitId",
  vpvisit."visitPoolId",
  vpvisit."visitUserName",
  vpvisit."visitDate",
  vpvisit."visitVernalPool",
  vpvisit."visitLatitude",
  vpvisit."visitLongitude",
  vpvisit."updatedAt" AS "visitUpdatedAt",
  vpreview."reviewId",
  vpreview."reviewQACode",
  vpreview."reviewPoolStatus",
  vpreview."updatedAt" AS "reviewUpdatedAt"
  FROM vpknown
  INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpknown."poolId"
  LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpknown."poolId"
  LEFT JOIN vpreview ON vpreview."reviewPoolId"=vpknown."poolId"
  LEFT JOIN vptown ON vpknown."knownTownId"=vptown."townId"
  LEFT JOIN vpcounty ON "govCountyId"="townCountyId";

SELECT * FROM "poolsGetOverview"
WHERE "updatedAt"<now()::timestamp
--AND "poolStatus"='Confirmed';
