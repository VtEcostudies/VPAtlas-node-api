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
			ST_AsGeoJSON(ST_GeomFromText('POINT(' || v."visitLongitude" || ' ' || v."visitLatitude" || ')'))::json as geometry,
            (SELECT
			 	--note: mappedComments contains characters that are illegal for geoJSON
				row_to_json(p) FROM (SELECT 
					vpreview."reviewId",
					vpreview."reviewUserName",
					vpreview."reviewUserId",
					vpreview."reviewPoolId",
					vpreview."reviewVisitIdLegacy",
					vpreview."reviewVisitId",
					vpreview."reviewQACode",
					vpreview."reviewQAAlt",
					vpreview."reviewQAPerson",
					vpreview."reviewQADate",
					--vpreview."reviewQANotes",
					vpreview."createdAt",
					vpreview."updatedAt",
					vpreview."reviewPoolStatus"
				) AS p
			) AS properties
        FROM vpreview
		INNER JOIN vpvisit v on "reviewPoolId"="visitPoolId"
    ) AS f
) AS fc;