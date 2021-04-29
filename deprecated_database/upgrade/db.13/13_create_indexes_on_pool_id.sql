--I was curious to know whether indexes would speed a slow query having multiple
--LEFT JOINs. These do not appear to help on the query found in the file 
--11_pool_visits_for_review.sql
CREATE UNIQUE INDEX pool_id_idx ON vpmapped ("mappedPoolId");
CREATE INDEX pool_id_idx_vpvisit ON vpvisit ("visitPoolId");
CREATE INDEX pool_id_idx_vpreview ON vpreview ("reviewPoolId");