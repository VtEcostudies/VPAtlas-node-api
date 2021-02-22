COPY (
	SELECT * from geojson_mapped
)
TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_mapped.geojson' with NULL '';