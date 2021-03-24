SELECT
    row_to_json(fc)
FROM (
    SELECT
		'FeatureCollection' AS type,
		'Vermont Vernal Pool Atlas - Pool Visit Reviews' AS name,
    '{ "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3857" } }'::json as crs,
    array_to_json(array_agg(f)) AS features
    FROM (
        SELECT
            'Feature' AS type,
			ST_AsGeoJSON(ST_GeomFromText('POINT(' || v."visitLongitude" || ' ' || v."visitLatitude" || ')'))::json as geometry,
            (SELECT
			 	--note: comments/notes contain characters that are illegal for geoJSON
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
					vpreview."reviewQANotes",
					vpreview."createdAt",
					vpreview."updatedAt",
					vpreview."reviewPoolStatus"
				) AS p
			) AS properties
        FROM vpreview
		INNER JOIN vpvisit v on "reviewPoolId"="visitPoolId"
    ) AS f
) AS fc;
