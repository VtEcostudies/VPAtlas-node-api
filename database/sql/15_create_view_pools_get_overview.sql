CREATE VIEW "poolsGetOverview" AS
SELECT
  to_json(knowntown) AS "knownTown",
  --to_json(mappeduser) as "mappedUser",
  --to_json(visituser) as "visitUser",
  vpknown."poolId",
  SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
  SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
  vpknown."poolStatus",
  vpknown."sourceVisitId",
  vpknown."sourceSurveyId",
  vpknown."updatedAt",
  vpmapped."mappedByUser",
  vpmapped."mappedMethod",
  vpmapped."mappedLocationAccuracy",
  vpmapped."mappedObserverUserName",
  vpvisit."visitId",
  vpvisit."visitUserName",
  vpvisit."visitDate",
  vpvisit."visitVernalPool",
  vpvisit."updatedAt" AS "visitUpdatedAt"
  FROM vpknown
  INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpknown."poolId"
  LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
  LEFT JOIN vptown AS knowntown ON vpknown."knownTownId"=knowntown."townId";

  SELECT * FROM "poolsGetOverview"
  WHERE "updatedAt"<now()::timestamp
  AND "poolStatus"='Confirmed';
