COPY (
SELECT
	json_build_object(
	'mappedData', to_json(vpmapped.*),
	'mappedTown', to_json(mappedtown),
	'visitData', to_json(vpvisit.*),
	'visitTown', to_json(visittown),
	'reviewData', to_json(vpreview.*)
	)
FROM vpmapped
  LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
  LEFT JOIN vptown AS mappedtown ON vpmapped."mappedTownId"=mappedtown."townId"
  LEFT JOIN vptown AS visittown ON vpvisit."visitTownId"=visittown."townId"
  LEFT JOIN vpreview ON vpreview."reviewVisitId"=vpvisit."visitId"
)
TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_query_all.json'
