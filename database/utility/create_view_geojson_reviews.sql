--DROP VIEW geojson_reviews;
CREATE OR REPLACE VIEW geojson_reviews AS
SELECT
    row_to_json(fc) AS geojson
FROM (
    SELECT
		'FeatureCollection' AS type,
		'Vermont Vernal Pool Atlas - Pool Reviews' AS name,
    '{ "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3857" } }'::json as crs,
    array_to_json(array_agg(f)) AS features
    FROM (
        SELECT
            'Feature' AS type,
            ST_AsGeoJSON("poolLocation")::json as geometry,
            (SELECT
              row_to_json(p) FROM (SELECT
                vpknown."poolId",
                vpknown."poolLocation",
                to_json(vptown) AS "knownTown",
                vpknown."sourceVisitId",
                vpknown."sourceSurveyId",
                vpknown."updatedAt" AS "knownUpdatedAt",
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
              	vpreview."createdAt" AS "reviewCreatedAt",
              	vpreview."updatedAt" AS "reviewUpdatedAt",
              	vpreview."reviewPoolStatus"
              ) AS p
            ) AS properties
        FROM vpknown
        INNER JOIN vpreview v on "reviewPoolId"="poolId"
    ) AS f
) AS fc;
