--All Pools with Visits without Reviews
select v."updatedAt" as "vUpdatedAt", *
from vpvisit v
left join vpreview r on r."reviewVisitId"=v."visitId"
where r."reviewVisitId" is null
union
--All Pools with Visits Updated since being Reviewed
select v."updatedAt" as "vUpdatedAt", * 
from vpvisit v
inner join vpreview r on r."reviewVisitId"=v."visitId"
where v."updatedAt" > r."updatedAt"
order by "vUpdatedAt" desc;

--left join on vpvisit.visitId is different from left join on vpvisit.visitPoolId...
select count(*)--, *
from vpmapped m
left join vpvisit v on v."visitPoolId"=m."mappedPoolId"
left join vpreview r on r."reviewVisitId"=v."visitId"
where r."reviewVisitId" is null and v."visitId" is not null
--order by v."visitId"

select count("mappedPoolId")--, *
from vpmapped m
left join vpvisit v on v."visitPoolId"=m."mappedPoolId"
left join vpreview r on r."reviewPoolId"=v."visitPoolId"
where r."reviewPoolId" is null and v."visitId" is not null
--order by v."visitId"
