--DROP VIEW geojson_mapped;
CREATE OR REPLACE VIEW geojson_mapped AS
SELECT
  row_to_json(fc)
  FROM (
    SELECT
		'FeatureCollection' AS type,
		'Vermont Vernal Pool Atlas - Mapped Pools' AS name,
		'{ "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3857" } }'::json as crs,
    array_to_json(array_agg(f)) AS features
    FROM (
        SELECT
          'Feature' AS type,
          ST_AsGeoJSON("poolLocation")::json as geometry,
          (SELECT row_to_json(p) FROM
            (SELECT
              vpknown."poolId",
              vpknown."poolLocation",
              to_json(vptown) AS "knownTown",
              vpknown."sourceVisitId",
              vpknown."sourceSurveyId",
              vpknown."updatedAt" AS "knownUpdatedAt",
              "mappedPoolId",
              "mappedMethod",
              "mappedLongitude", --superceded by GEOMETRY(POINT) above. included for historical reference.
              "mappedLatitude", --superceded by GEOMETRY(POINT) above. included for historical reference.
              "mappedObserverUserName",
              "mappedByUser",
              "mappedByUserId",
              "mappedDateText",
              "mappedMethod",
              "mappedConfidence",
              "mappedSource",
              "mappedSource2",
              "mappedPhotoNumber",
              "mappedLocationAccuracy",
              "mappedShape",
              "mappedComments",
              "mappedlocationInfoDirections",
              "mappedLocationUncertainty",
              "mappedTownId",
              vpmapped."createdAt" as "mappedCreatedAt",
              vpmapped."updatedAt" as "mappedUpdatedAt",
              "mappedLandownerPermission"
/*
              "mappedLandownerInfo",
              "mappedLandownerName",
              "mappedLandownerAddress",
              "mappedLandownerTown",
              "mappedLandownerStateAbbrev",
              "mappedLandownerZip5",
              "mappedLandownerPhone",
              "mappedLandownerEmail"
*/
            ) AS p
          ) AS properties
        FROM vpknown
        INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpknown."poolId"
        INNER JOIN vptown on vpknown."knownTownId"=vptown."townId"
    ) AS f
  ) AS fc;

COPY (
  SELECT * from geojson_mapped
)
TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_mapped.geojson' with NULL '';
