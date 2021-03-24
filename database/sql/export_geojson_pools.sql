COPY (
	select * from geojson_pools
) TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_pools.geojson' with NULL '';
