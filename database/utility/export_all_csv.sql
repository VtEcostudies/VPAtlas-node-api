COPY (
SELECT
  to_json(mappedtown) AS "mappedTown",
  to_json(visittown) AS "visitTown",
  vpmapped.*,
  vpmapped."updatedAt" AS "mappedUpdatedAt",
  vpmapped."createdAt" AS "mappedCreatedAt",
  vpmapped."mappedPoolId" AS "poolId",
  vpmapped."mappedLatitude" AS "latitude",
  vpmapped."mappedLongitude" AS "longitude",
  vpvisit.*,
  vpvisit."updatedAt" AS "visitUpdatedAt",
  vpvisit."createdAt" AS "visitCreatedAt",
  vpreview.*,
  vpreview."updatedAt" AS "reviewUpdatedAt",
  vpreview."createdAt" AS "reviewCreatedAt"
  FROM vpmapped
  LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
  LEFT JOIN vptown AS mappedtown ON vpmapped."mappedTownId"=mappedtown."townId"
  LEFT JOIN vptown AS visittown ON vpvisit."visitTownId"=visittown."townId"
  LEFT JOIN vpreview ON vpreview."reviewVisitId"=vpvisit."visitId"
  WHERE
  (vpmapped."updatedAt">'1070-01-01'::timestamp
  OR vpvisit."updatedAt">'1970-01-01'::timestamp)
  ORDER BY "mappedPoolId"
)
TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_query_all.csv'
delimiter ',' csv header;