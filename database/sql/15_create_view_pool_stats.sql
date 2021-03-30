CREATE OR REPLACE VIEW pool_stats AS
select
(select count("mappedPoolId") from vpmapped join vpknown on "mappedPoolId"="poolId") as total_data,
(select count("mappedPoolId") from vpmapped join vpknown on "mappedPoolId"="poolId" where "poolStatus"!='Eliminated' AND "poolStatus"!='Duplicate'
) as total,
(select count("mappedPoolId") from vpmapped join vpknown on "mappedPoolId"="poolId" where "poolStatus"='Potential') as potential,
(select count("mappedPoolId") from vpmapped join vpknown on "mappedPoolId"="poolId" where "poolStatus"='Probable') as probable,
(select count("mappedPoolId") from vpmapped join vpknown on "mappedPoolId"="poolId" where "poolStatus"='Confirmed') as confirmed,
(select count("mappedPoolId") from vpmapped join vpknown on "mappedPoolId"="poolId" where "poolStatus"='Duplicate') as duplicate,
(select count("mappedPoolId") from vpmapped join vpknown on "mappedPoolId"="poolId" where "poolStatus"='Eliminated') as eliminated,
(select count("mappedPoolId") from vpmapped m
inner join vpknown on "mappedPoolId"="poolId"
left join vpvisit v on v."visitPoolId"=m."mappedPoolId"
left join vpreview r on r."reviewVisitId"=v."visitId"
where
("reviewId" IS NULL AND "visitId" IS NOT NULL
OR (r."updatedAt" IS NOT NULL AND m."updatedAt" > r."updatedAt")
OR (r."updatedAt" IS NOT NULL AND v."updatedAt" > r."updatedAt"))
) as review,
(select count(distinct("visitPoolId")) from vpvisit
inner join vpmapped on vpmapped."mappedPoolId"=vpvisit."visitPoolId"
inner join vpknown on "mappedPoolId"="poolId"
where "poolStatus"!='Eliminated' AND "poolStatus"!='Duplicate'
) as visited,
(select count(distinct("mappedPoolId")) from vpmapped
left join vpvisit on vpmapped."mappedPoolId"=vpvisit."visitPoolId"
where "mappedByUser"=current_setting('body.username')
OR "visitUserName"=current_setting('body.username')
) as mine,
(select 0) as monitored;

SET body.username = 'sfaccio';
select * from pool_stats;
