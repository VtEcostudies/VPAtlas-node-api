--select * from vpvisit where "visitUserId"!=0;
--ALTER TABLE vpuser ADD CONSTRAINT "vpuser_id_unique_key" UNIQUE("id");
--ALTER TABLE vpvisit ADD CONSTRAINT fk_vpvisit_vpuser_id FOREIGN KEY ("visitUserId") REFERENCES vpuser ("id");
--ALTER TABLE vpvisit ADD CONSTRAINT fk_vpvisit_vpmapped_poolid FOREIGN KEY ("visitPoolId") REFERENCES vpmapped ("mappedPoolId");

--find problems with importing vpvisit data, and creating vpmapped data from vpvisit data

--find pools lacking visitDate
select * from vpvisit where "visitDate" is null;
update vpvisit set "visitDate"='1/1/1900' WHERE "visitDate" is null;

--find vpvisit pools not in vpmapped that don't have lat/lon values
select "visitUserName","visitPoolId" from (
	select distinct("visitPoolId"), "visitUserName", "visitLatitude", "visitLongitude"
	from vpvisit 
	left join vpmapped
	on vpvisit."visitPoolId"=vpmapped."mappedPoolId"
	where vpmapped."mappedPoolId" IS NULL
) visits_not_mapped
where "visitLatitude" is null or "visitLongitude" is null;

--create bogus lat/lon values for those pools
--('NEW209','NEW283','NEW344','NEW350');

update vpvisit set "visitLatitude"=45, "visitLongitude"=-73 WHERE "visitPoolId" IN
(
select "visitPoolId" from (
	select distinct("visitPoolId"), "visitLatitude", "visitLongitude"
	from vpvisit 
	left join vpmapped
	on vpvisit."visitPoolId"=vpmapped."mappedPoolId"
	where vpmapped."mappedPoolId" IS NULL
) visits_not_mapped
where "visitLatitude" is null or "visitLongitude" is null
);

--set the visit locations back to null for those pools? naw...
--update vpvisit set "visitLatitude"=null, "visitLongitude"=null WHERE "visitPoolId" IN ('NEW209','NEW283','NEW344','NEW350');
select "visitPoolId", "visitUserName" from vpvisit where "visitPoolId" like 'NEW%' and ("visitLatitude" is null or "visitLongitude" is null);

insert into vpmapped (
	"mappedPoolId", 
	"mappedByUser",
	"mappedDateText",
    "mappedLatitude",
    "mappedLongitude",
	"mappedComments",
    "mappedMethod",
    "mappedLocationUncertainty",
    "mappedlocationInfoDirections"
)
select distinct on ("visitPoolId") "visitPoolId",
    "visitUserName",
    DATE("visitDate"),
    "visitLatitude",
    "visitLongitude",
    "visitLocationComments",
	(SELECT 'Visit' AS "visitMappedMethod"),
    "visitCertainty",
    "visitDirections"
from vpvisit 
left join vpmapped
on vpvisit."visitPoolId"=vpmapped."mappedPoolId"
where vpmapped."mappedPoolId" IS NULL;

--hmm. that generated only 296 NEW* pools (plus at least one previously unmapped KWN pool, KWN1062)
select "visitPoolId" from vpvisit where "visitPoolId" like 'NEW%';
select distinct("visitPoolId") from vpvisit where "visitPoolId" like 'NEW%';
--OK. That makes sense - there are 296 distinct poolIds. 7 rows are repeat visits

--looking at NEW pools on the map, 2 have bad lat/lon data: NEW70 and NEW291
--we could fix it here but that's precisely what the tool is for. let the admins do it.