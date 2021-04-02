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

--create trigger function to update vpknown.knownTownId when vpknown.poolLocation changes
--we do this because a JOIN query to locate town from poolLocation is too slow
CREATE FUNCTION set_townid_from_pool_location()
    RETURNS trigger
		LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
   NEW."knownTownId" = (SELECT "geoTownId" FROM geo_town WHERE ST_WITHIN(NEW."poolLocation","geoTownPolygon"));
   RETURN NEW;
END;
$BODY$;

ALTER FUNCTION set_townid_from_pool_location()
    OWNER TO vpatlas;

--create triggers on vpknown to update vpknown.knownTownId when vpknown.poolLocation changes
--we do this because a JOIN query to locate town from poolLocation is too slow

--DROP TRIGGER trigger_update_townid_after_insert_vpknown ON vpknown;
--create trigger on vpknown to update vpknown.knownTownId on vpknown insert
CREATE TRIGGER trigger_update_townid_after_insert_vpknown
    AFTER UPDATE
    ON vpknown
    FOR EACH ROW
    EXECUTE PROCEDURE set_townid_from_pool_location();

--DROP TRIGGER trigger_update_townid_after_update_pool_location;
--create trigger on vpknown to update vpknown.knownTownId when vpknown.poolLocation updated
CREATE TRIGGER trigger_update_townid_after_update_pool_location
    AFTER UPDATE
    ON vpknown
    FOR EACH ROW
    EXECUTE PROCEDURE set_townid_from_pool_location();
