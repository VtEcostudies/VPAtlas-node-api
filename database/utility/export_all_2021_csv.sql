COPY ( SELECT
	vpknown."poolId",
	SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
	SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
	vpknown."poolStatus",
	vpknown."sourceVisitId",
	vpknown."sourceSurveyId",
	vpknown."updatedAt",
	vpvisit.*
	from vpknown
	inner join vpvisit on "visitPoolId"="poolId"
	--where "poolStatus" IN ('Potential', 'Probable', 'Confirmed')
) TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_visits.csv'  DELIMITER ',' CSV HEADER;

COPY ( SELECT
	vpknown."poolId",
	SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
	SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
	vpknown."poolStatus",
	vpknown."sourceVisitId",
	vpknown."sourceSurveyId",
	vpknown."updatedAt",
	vpmapped.*,
	vpvisit.*,
	vpreview.*
	from vpknown
	inner join vpmapped on "mappedPoolId"="poolId"
	left join vpvisit on "visitPoolId"="poolId"
	left join vpreview on "reviewPoolId"="poolId"
	--where "poolStatus" IN ('Potential', 'Probable', 'Confirmed')
) TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_pools.csv'  DELIMITER ',' CSV HEADER;
