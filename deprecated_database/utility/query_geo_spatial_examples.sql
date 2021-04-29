--example query pools **NOT** in state
SELECT "mappedPoolId","mappedPoolLocation","mappedPoolStatus" FROM vpmapped
--INNER JOIN geo_state ON NOT ST_WITHIN("mappedPoolLocation","geoPolygon")
INNER JOIN geo_state ON ST_WITHIN("mappedPoolLocation","geoPolygon")
INNER JOIN vpstate ON "geoId"="stateId"
WHERE "stateName" = 'Vermont';

--example query pools in county
SELECT "mappedPoolId","mappedPoolLocation" FROM vpmapped
INNER JOIN geo_county ON ST_WITHIN("mappedPoolLocation","geoPolygon")
INNER JOIN vpcounty ON "geoId"="countyId"
WHERE UPPER("countyName") LIKE UPPER('%Windsor%'); --countyName is ALL CAPS

--example query pools in biophysical region
SELECT "mappedPoolId","mappedPoolLocation" FROM vpmapped
INNER JOIN geo_biophysical ON ST_WITHIN("mappedPoolLocation","geoPolygon")
INNER JOIN vpbiophysical ON "geoId"="biophysicalId"
WHERE UPPER("biophysicalName") LIKE UPPER('%Champlain%Valley%'); --'Taconic%South%'

--example query pools in town
SELECT "mappedPoolId","mappedPoolLocation","mappedPoolStatus" FROM vpmapped
INNER JOIN geo_town ON ST_WITHIN("mappedPoolLocation","geoTownPolygon")
INNER JOIN vptown ON "geoTownId"="townId"
WHERE UPPER("townName") = UPPER('Strafford');
