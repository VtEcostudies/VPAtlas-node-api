--DROP TABLE geo_town;
create table geo_town (
	"geoTownId" integer NOT NULL,
	"geoTownPolygon" geometry(Geometry, 4326),
	CONSTRAINT geo_town_pkey PRIMARY KEY ("geoTownId"),
	CONSTRAINT fk_geo_town_id FOREIGN KEY ("geoTownId") REFERENCES vptown ("townId")
)

--TRUNCATE TABLE geo_town;

--Views that prevent ALTER TABLE vpknown must be dropped and re-added:
/*
DROP VIEW "mappedGetOverview";
DROP VIEW "poolsGetOverview";
DROP VIEW "geojson_mapped";
DROP VIEW "geojson_visits";
SELECT UpdateGeometrySRID('vpknown','poolLocation',4326);
*/

select "poolId", "poolLocation"
from vpknown
inner join geo_town ON ST_WITHIN("poolLocation", "geoTownPolygon")
inner join vptown ON "townId"="geoTownId"
WHERE "townName" IN ('Strafford', 'Norwich');

--fill all vpknown knownTownIds from PostGIS towns!
update vpknown
set "knownTownId"="geoTownId"
from geo_town
where ST_WITHIN("poolLocation", "geoTownPolygon");
