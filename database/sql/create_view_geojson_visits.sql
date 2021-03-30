--DROP VIEW geojson_visits;
CREATE OR REPLACE VIEW geojson_visits AS
SELECT
    row_to_json(fc) as geojson
FROM (
    SELECT
		'FeatureCollection' AS type,
		'Vermont Vernal Pool Atlas - Pool Visits' as name,
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
                vpvisit.*
                vpvisit."createdAt" AS "visitCreatedAt",
                vpvisit."updatedAt" AS "visitUpdatedAt"
              ) AS p
          ) AS properties
        FROM vpknown
        INNER JOIN vpvisit on "visitPoolId"="poolId"
        INNER JOIN vptown on vpknown."knownTownId"=vptown."townId"
        WHERE "visitId" > 0
    ) AS f
) AS fc;
