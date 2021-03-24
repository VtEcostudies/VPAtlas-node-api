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
          ST_AsGeoJSON(ST_GeomFromText('POINT(' || "mappedLongitude" || ' ' || "mappedLatitude" || ')'))::json as geometry,
          (SELECT row_to_json(p) FROM
            (SELECT
              "mappedPoolId",
              "mappedPoolStatus",
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
              "createdAt",
              "updatedAt",
              "mappedLandownerPermission",
              "mappedLandownerInfo"
/*
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
        FROM vpmapped
        WHERE "mappedPoolStatus" IN ('Potential', 'Probable', 'Confirmed')
    ) AS f
  ) AS fc;
