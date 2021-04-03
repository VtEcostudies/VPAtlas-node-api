--DROP TABLE geo_town;
create table geo_town (
	"geoTownId" integer NOT NULL,
	"geoTownPolygon" geometry(Geometry, 4326),
	CONSTRAINT geo_town_pkey PRIMARY KEY ("geoTownId"),
	CONSTRAINT fk_geo_town_id FOREIGN KEY ("geoTownId") REFERENCES vptown ("townId")
)

--TRUNCATE TABLE geo_town;

--Views that prevent ALTER TABLE vpmapped must be dropped and re-added:
/*
DROP VIEW "mappedGetOverview";
DROP VIEW "poolsGetOverview";
DROP VIEW "geojson_mapped";
DROP VIEW "geojson_visits";
SELECT UpdateGeometrySRID('vpmapped','poolLocation',4326); --this amounts to ALTER TABLE ALTER COLUMN...
*/

--a test query
select "mappedPoolId", "mappedPoolLocation"
from vpmapped
inner join geo_town ON ST_WITHIN("mappedPoolLocation", "geoTownPolygon")
inner join vptown ON "mappedTownId"="geoTownId"
WHERE "townName" IN ('Strafford', 'Norwich');

--fill all vpmapped mappedTownIds from PostGIS towns!
update vpmapped
set "mappedTownId"="geoTownId"
from geo_town
where ST_WITHIN("mappedPoolLocation", "geoTownPolygon");

--DROP FUNCTION set_townid_from_pool_location();
--create trigger function to set mappedPoolLocation, mappedTownId from lat/lon
--we set mappedPoolLocation from lat/lon because the UI doesn't send PostGIS geometry
--we set mappedTownId because a JOIN query to locate town from mappedPoolLocation is too slow
CREATE OR REPLACE FUNCTION set_townid_from_pool_location()
    RETURNS trigger
		LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
   NEW."mappedTownId" = (SELECT "geoTownId" FROM geo_town WHERE ST_WITHIN(NEW."mappedPoolLocation","geoTownPolygon"));
   RETURN NEW;
END;
$BODY$;

ALTER FUNCTION set_townid_from_pool_location()
    OWNER TO vpatlas;

--DROP TRIGGER trigger_update_townid_after_insert_vpmapped ON vpmapped;
--create trigger on vpmapped to update vpmapped.mappedTownId on vpmapped insert
CREATE TRIGGER trigger_update_townid_after_insert_vpmapped
    AFTER INSERT
    ON vpmapped
    FOR EACH ROW
    EXECUTE PROCEDURE set_townid_from_pool_location();

--DROP TRIGGER trigger_update_townid_after_update_pool_location;
--create trigger on vpmapped to update vpmapped.mappedTownId when vpmapped.poolLocation updated
CREATE TRIGGER trigger_update_townid_after_update_pool_location
    AFTER UPDATE
    ON vpmapped
    FOR EACH ROW
    EXECUTE PROCEDURE set_townid_from_pool_location();
