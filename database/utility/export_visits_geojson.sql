COPY (
	select * from geojson_visits
) TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_visits.geojson' with NULL '';