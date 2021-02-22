SELECT
    row_to_json(fc)
FROM (
    SELECT
		'FeatureCollection' AS type,
		'Vermont Vernal Pool Atlas - Mapped Pools' AS name,
		--"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        array_to_json(array_agg(f)) AS features
    FROM (
        SELECT
            'Feature' AS type,
			ST_AsGeoJSON(ST_GeomFromText('POINT(' || "mappedLongitude" || ' ' || "mappedLatitude" || ')'))::json as geometry,
            (SELECT
			 	--note: mappedComments contains characters that are illegal for geoJSON
				row_to_json(p) FROM (SELECT "mappedPoolId", "mappedPoolStatus", "mappedMethod", "mappedObserverUserName", "updatedAt") AS p
			) AS properties
        FROM vpmapped
		WHERE "mappedPoolStatus" IN ('Potential', 'Probable', 'Confirmed')
    ) AS f
) AS fc;