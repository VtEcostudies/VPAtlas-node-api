COPY (
	select * from geojson_reviews
) TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_reviews.geojson' with NULL '';