--DROP VIEW geojson_pools;
CREATE OR REPLACE VIEW geojson_pools AS
SELECT
    row_to_json(fc)
FROM (
    SELECT
		'FeatureCollection' AS type,
		'Vermont Vernal Pool Atlas - Pools plus Visits with Review' AS name,
    '{ "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3857" } }'::json as crs,
    array_to_json(array_agg(f)) AS features
    FROM (
      SELECT
        'Feature' AS type,
		     ST_AsGeoJSON(ST_GeomFromText('POINT(' || visits."visitLongitude" || ' ' || visits."visitLatitude" || ')'))::json as geometry,
            (SELECT
    				    row_to_json(p) FROM (
                  SELECT visits.*, mapped.*
				        ) AS p
	           ) AS properties
          FROM vpmapped mapped LEFT JOIN (
          	SELECT vc.visit_count, v.* FROM vpvisit v INNER JOIN (
          		SELECT
          			"visitPoolId" as vcvpid, count("visitPoolId") as visit_count
          		FROM
          			vpvisit
          		GROUP BY
          			"visitPoolId"
          		ORDER BY
          			visit_count desc
          		) as vc
          	ON v."visitPoolId"=vcvpid
          	ORDER BY vc.visit_count desc, v."visitPoolId"
          ) AS visits
          ON mapped."mappedPoolId"=visits."visitPoolId"
          WHERE "mappedPoolStatus" IN ('Potential','Probable','Confirmed')
          ORDER BY visits.visit_count desc, visits."visitPoolId"
    ) AS f
) AS fc;
