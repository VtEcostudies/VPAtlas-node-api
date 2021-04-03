
--ALTER TABLE vpmapped ADD COLUMN "mappedPoolStatus" POOLSTATUS DEFAULT 'Potential';
--ALTER TABLE vpmapped ALTER COLUMN "mappedPoolStatus" SET DEFAULT 'Potential';

--populate vpmapped geometry with currently-known mapped pool data
UPDATE vpmapped SET
"mappedPoolStatus" = "poolStatus"
FROM vpknown
WHERE "poolId"="mappedPoolId";

DROP TABLE IF EXISTS vpknown CASCADE;

DROP TRIGGER trigger_insert_vpknown_after_insert_vpmapped ON vpmapped;
DROP FUNCTION IF EXISTS insert_vpknown_after_insert_vpmapped();
DROP TRIGGER trigger_delete_vpknown_before_delete_vpmapped ON vpmapped;
DROP FUNCTION IF EXISTS delete_vpknown_before_delete_vpmapped();
DROP TRIGGER trigger_update_vpknown_after_update_vpmapped ON vpmapped;
DROP FUNCTION IF EXISTS update_vpknown_after_update_vpmapped();

DELETE FROM vpmapped where "mappedPoolId"='None';
DELETE FROM vpvisit where "visitId"=0;
DELETE FROM vpsurvey where "surveyId"=0;

ALTER TABLE vpmapped ALTER COLUMN "mappedPoolLocation" TYPE GEOMETRY(Geometry, 4326);
ALTER TABLE vpmapped ALTER COLUMN "mappedPoolBorder" TYPE GEOMETRY(Geometry, 4326);

--Update vpmapped geolocation with original mapped data
UPDATE vpmapped SET
	"mappedPoolLocation" = ST_GeomFromText('POINT(' || "mappedLongitude" || ' ' || "mappedLatitude" || ')');

--Update vpmapped geolocation with the most recent visit data
UPDATE vpmappped SET
	"mappedpoolLocation" = ST_GeomFromText('POINT(' || "visitLongitude" || ' ' || "visitLatitude" || ')')
FROM vpvisit
WHERE "mappedPoolId"="visitPoolId"
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

--fix a but in create mapped pool where mappedMethod is incorrect
select * from vpmapped where "mappedMethod"='Visited';
update vpmapped set "mappedMethod"='Visit' where "mappedMethod"='Visited';

--create a data type for mappedMethod to avoid future problems
CREATE TYPE vp_mapped_method AS ENUM ('Aerial', 'Known', 'Visit');
ALTER TYPE vp_mapped_method OWNER TO vpatlas;
ALTER TABLE vpmapped ALTER COLUMN "mappedMethod" TYPE vp_mapped_method USING "mappedMethod"::vp_mapped_method;
