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
from vpmapped
LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
LEFT JOIN vpreview ON vpreview."reviewPoolId"=vpmapped."mappedPoolId"
LEFT JOIN vptown AS mappedtown ON vpmapped."mappedTownId"=mappedtown."townId"
LEFT JOIN vptown AS visittown ON vpvisit."visitTownId"=visittown."townId"
--where vpreview."reviewVisitId" is null and vpvisit."visitId" is not null
where vpreview."reviewId" is null and vpvisit."visitId" is not null