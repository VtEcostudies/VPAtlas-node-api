
DELETE FROM vpmapped where "mappedPoolId"='None';
DELETE FROM vpvisit where "visitId"=0;
DELETE FROM vpsurvey where "surveyId"=0;

--ALTER TABLE vpmapped ADD COLUMN "mappedPoolStatus" POOLSTATUS DEFAULT 'Potential';
--ALTER TABLE vpmapped ALTER COLUMN "mappedPoolStatus" SET DEFAULT 'Potential';

--populate vpmapped geometrry with currently-known mapped pool data
UPDATE vpmapped SET
"mappedPoolStatus" = "poolStatus"
FROM vpknown
WHERE "poolId"="mappedPoolId";

--DROP TABLE IF EXISTS vpknown;

ALTER TABLE vpmapped ALTER COLUMN "mappedPoolLocation" TYPE GEOMETRY(Geometry);

--Update vpmapped geolocation with the most recent visit data
UPDATE vpmappped SET
"mappedpoolLocation" = ST_GeomFromText('POINT(' || "visitLongitude" || ' ' || "visitLatitude" || ')'),
"sourceVisitId" = "visitId"
FROM vpvisit
WHERE "poolId"="visitPoolId"
AND "visitLongitude"::INTEGER != 0
AND "visitLatitude"::INTEGER != 0
AND "visitId" IN (
	SELECT MAX("visitId") AS "maxVisitId" FROM vpvisit
	GROUP BY "visitPoolId"
);

--Test query to show that MAX("visitId") Grouped By "visitPoolId" gets the latest visit to a pool
SELECT "cntVisitId","maxVisitId","visitId","visitPoolId"
FROM vpvisit LEFT JOIN (
	SELECT MAX("visitId") AS "maxVisitId", COUNT("visitId") AS "cntVisitId"
	FROM vpvisit
	GROUP BY "visitPoolId"
) as max
ON vpvisit."visitId"="maxVisitId"
ORDER BY "visitPoolId";

--somehow, updatedAt trigger was missing from vpmapped?
CREATE TRIGGER trigger_updated_at
    BEFORE UPDATE
    ON vpmapped
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();

--DROP TRIGGER trigger_insert_vpknown_after_insert_vpmapped ON vpmapped;
--DROP FUNCTION insert_vpknown_after_insert_vpmapped();
--DROP TRIGGER trigger_delete_vpknown_before_delete_vpmapped ON vpmapped;
--DROP FUNCTION delete_vpknown_before_delete_vpmapped();

--create trigger function to update vpknown data after vpmapped update
--we preserve the column mappedPoolStatus to enable this to be done easily
CREATE OR REPLACE FUNCTION update_vpknown_after_update_vpmapped()
    RETURNS trigger
	LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
		UPDATE vpknown SET
		"poolLocation" = ST_GEOMFROMTEXT('POINT(' || NEW."mappedLongitude" || ' ' ||  NEW."mappedLatitude" || ')', 4326),
		"poolStatus" = NEW."mappedPoolStatus"
		WHERE "poolId" = NEW."mappedPoolId";
		RETURN NEW;
END;
$BODY$;

ALTER FUNCTION update_vpknown_after_update_vpmapped()
    OWNER TO vpatlas;

CREATE TRIGGER trigger_update_vpknown_after_update_vpmapped
    AFTER UPDATE
    ON vpmapped
    FOR EACH ROW
    EXECUTE PROCEDURE update_vpknown_after_update_vpmapped();
