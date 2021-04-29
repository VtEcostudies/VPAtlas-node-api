ALTER TABLE vpreview ADD COLUMN IF NOT EXISTS "reviewPoolLocator" BOOLEAN;

--DROP FUNCTION IF EXISTS set_vpmapped_geolocation_from_vpvisit_coordinates();
CREATE OR REPLACE FUNCTION set_vpmapped_geolocation_from_vpvisit_coordinates()
    RETURNS trigger
		LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
	visit record;
BEGIN
	IF NEW."reviewPoolLocator" THEN
		SELECT * FROM vpvisit WHERE "visitId"=NEW."reviewVisitId" INTO visit;
		RAISE NOTICE 'set_vpmapped_geolocation_from_vpvisit_coordinates() | Set geoLocation from vpvisit lat/lon for reviewId:% | visitId:% | poolId:% | lat:% | lon:%',
			NEW."reviewId", NEW."reviewVisitId", NEW."reviewPoolId", visit."visitLatitude", visit."visitLongitude";
		UPDATE vpmapped SET "mappedPoolLocation" = ST_GEOMFROMTEXT('POINT(' || visit."visitLongitude" || ' ' ||  visit."visitLatitude" || ')', 4326)
			WHERE "mappedPoolId"=NEW."reviewPoolId";
	END IF;
	RETURN NEW;
END;
$BODY$;

ALTER FUNCTION set_vpmapped_geolocation_from_vpvisit_coordinates()
    OWNER TO vpatlas;

DROP TRIGGER IF EXISTS trigger_after_insert_set_vpmapped_pool_location ON vpreview;
CREATE TRIGGER trigger_after_insert_set_vpmapped_pool_location AFTER INSERT ON vpreview
  FOR EACH ROW EXECUTE PROCEDURE set_vpmapped_geolocation_from_vpvisit_coordinates();
DROP TRIGGER IF EXISTS trigger_after_update_set_vpmapped_pool_location ON vpreview;
CREATE TRIGGER trigger_after_update_set_vpmapped_pool_location AFTER UPDATE ON vpreview
  FOR EACH ROW EXECUTE PROCEDURE set_vpmapped_geolocation_from_vpvisit_coordinates();
