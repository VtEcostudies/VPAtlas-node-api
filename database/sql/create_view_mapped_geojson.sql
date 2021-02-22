--DROP VIEW geojson_mapped;
CREATE OR REPLACE VIEW geojson_mapped AS 
SELECT
    row_to_json(fc) AS geojson
FROM (
    SELECT
		'FeatureCollection' AS type,
		'Vermont Vernal Pool Atlas - Mapped Pools' AS name,
        array_to_json(array_agg(f)) AS features
    FROM (
        SELECT
            'Feature' AS type,
			ST_AsGeoJSON(ST_GeomFromText('POINT(' || "mappedLongitude" || ' ' || "mappedLatitude" || ')'))::json as geometry,
            (SELECT
			 	--note: mappedComments, others contain characters that are illegal for geoJSON
				row_to_json(p) FROM (
					SELECT
					vpmapped."mappedPoolId",
					vpmapped."mappedByUser",
					vpmapped."mappedByUserId",
					vpmapped."mappedDateText",
					--vpmapped."mappedDateUnixSeconds",
					--vpmapped."mappedLatitude",
					--vpmapped."mappedLongitude",
					vpmapped."mappedConfidence",
					vpmapped."mappedSource",
					vpmapped."mappedSource2",
					vpmapped."mappedPhotoNumber",
					vpmapped."mappedLocationAccuracy",
					vpmapped."mappedShape",
					--vpmapped."mappedComments",
					vpmapped."createdAt",
					vpmapped."updatedAt",
					--vpmapped."mappedlocationInfoDirections",
					vpmapped."mappedLandownerPermission",
					--vpmapped."mappedLandownerInfo",
					vpmapped."mappedLocationUncertainty",
					--vpmapped."mappedTownId",
					--vpmapped."mappedPoolLocation",
					--vpmapped."mappedPoolBorder",
					--vpmapped."mappedLandownerName",
					--vpmapped."mappedLandownerAddress",
					--vpmapped."mappedLandownerTown",
					--vpmapped."mappedLandownerStateAbbrev",
					--vpmapped."mappedLandownerZip5",
					--vpmapped."mappedLandownerPhone",
					--vpmapped."mappedLandownerEmail",
					vpmapped."mappedPoolStatus",
					vpmapped."mappedMethod",
					vpmapped."mappedObserverUserName"
				) AS p
			) AS properties
        FROM vpmapped
		WHERE "mappedPoolStatus" IN ('Potential', 'Probable', 'Confirmed')
    ) AS f
) AS fc;