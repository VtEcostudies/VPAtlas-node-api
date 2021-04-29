CREATE OR REPLACE VIEW pool_stats AS
select
(select count("mappedPoolId") from vpmapped) as total_data,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"!='Eliminated' AND "mappedPoolStatus"!='Duplicate'
) as total,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Potential') as potential,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Probable') as probable,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Confirmed') as confirmed,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Duplicate') as duplicate,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Eliminated') as eliminated,
(select count("mappedPoolId") from vpmapped m
left join vpvisit v on v."visitPoolId"=m."mappedPoolId"
left join vpreview r on r."reviewVisitId"=v."visitId"
where
("reviewId" IS NULL AND "visitId" IS NOT NULL
OR (r."updatedAt" IS NOT NULL AND m."updatedAt" > r."updatedAt")
OR (r."updatedAt" IS NOT NULL AND v."updatedAt" > r."updatedAt"))
) as review,
(select count(distinct("visitPoolId")) from vpvisit
inner join vpmapped on vpmapped."mappedPoolId"=vpvisit."visitPoolId"
where "mappedPoolStatus"!='Eliminated' AND "mappedPoolStatus"!='Duplicate'
) as visited,
(select count(distinct("surveyPoolId")) from vpsurvey
inner join vpmapped on "mappedPoolId"="surveyPoolId"
where "mappedPoolStatus"!='Eliminated' AND "mappedPoolStatus"!='Duplicate'
) as monitored
(select count(distinct("mappedPoolId")) from vpmapped
left join vpvisit on "mappedPoolId"="visitPoolId"
where "mappedByUser"=current_setting('body.username')
OR "visitUserName"=current_setting('body.username')
) as mine,

SET body.username = 'sfaccio';
select * from pool_stats;
