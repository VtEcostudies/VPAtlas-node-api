DROP VIEW IF EXISTS "poolsGetAll";
CREATE OR REPLACE VIEW "poolsGetAll" AS
SELECT
  vptown.*,
  vpknown."poolId",
  SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
  SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
  vpknown."poolStatus",
  vpknown."sourceVisitId",
  vpknown."sourceSurveyId",
  vpknown."updatedAt",
  vpmapped.*,
  vpmapped."updatedAt" AS "mappedUpdatedAt",
  vpvisit.*,
  vpvisit."updatedAt" AS "visitUpdatedAt",
  vpreview.*,
  vpreview."updatedAt" AS "reviewUpdatedAt"
  FROM vpknown
  INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpknown."poolId"
  LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpknown."poolId"
  LEFT JOIN vpreview ON vpreview."reviewPoolId"=vpknown."poolId"
  LEFT JOIN vptown ON vpknown."knownTownId"=vptown."townId";

SELECT * FROM "poolsGetAll"
WHERE "updatedAt"<now()::timestamp
AND "poolStatus"='Confirmed';
