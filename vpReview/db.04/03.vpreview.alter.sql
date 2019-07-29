--Add nuance to QA Code 'ERROR' to distinguish between those that get Eliminated, and those
--that return to 'Potential' status
UPDATE vpreview SET "reviewQACode"='ERROR_Eliminate' WHERE "reviewPoolId"='KWN500';
UPDATE vpreview SET "reviewQACode"='ERROR_LocAcc' WHERE "reviewPoolId"='MLS103';
UPDATE vpreview SET "reviewQACode"='ERROR_LocAcc' WHERE "reviewPoolId"='MLS1794';
UPDATE vpreview SET "reviewQACode"='ERROR_LocAcc' WHERE "reviewPoolId"='MLS1926';
UPDATE vpreview SET "reviewQACode"='ERROR_LocAcc' WHERE "reviewPoolId"='NEW171';
UPDATE vpreview SET "reviewQACode"='ERROR_Eliminate' WHERE "reviewPoolId"='NEW291';
UPDATE vpreview SET "reviewQACode"='ERROR_Eliminate' WHERE "reviewPoolId"='NEW344';
UPDATE vpreview SET "reviewQACode"='ERROR_Eliminate' WHERE "reviewPoolId"='NEW350';
UPDATE vpreview SET "reviewQACode"='ERROR_Eliminate' WHERE "reviewPoolId"='NEW39';
UPDATE vpreview SET "reviewQACode"='ERROR_LocAcc' WHERE "reviewPoolId"='SDF329';

UPDATE vpreview SET "reviewPoolStatus"='Potential' 
--SELECT "reviewPoolId","reviewPoolStatus","reviewQACode" FROM vpreview
WHERE "reviewPoolId" IN (
'MLS103',
'MLS1794',
'MLS1926',
'NEW171',
'SDF329'
);

UPDATE vpreview SET "reviewPoolStatus"='Eliminated'
--SELECT "reviewPoolId","reviewPoolStatus","reviewQACode" FROM vpreview
WHERE "reviewPoolId" IN (
'KWN500',
'NEW291',
'NEW344',
'NEW350',
'NEW39'
);

--Apply/copy reviewPoolStatus to mappedPoolStatus
--Where there is more than one review for the same poolId (66 pools), copy reviewPoolStatus
--from the *presumed latest* review. This is not obvious - reviewQADate is often missing, and
--visitIdLegacy values having higher values sometimes have earlier dates. Since we can't depend
--upon reviewQADate, we use reviewVisitIdLegacy to order the SELECT and apply all review rows when
--multiple reviews apply to the same pool. Since the highest value is applied last, it prevails.
CREATE OR REPLACE FUNCTION set_mapped_status_from_review_status_all() 
  RETURNS VOID 
AS
$$
DECLARE 
   review_row vpreview%rowtype;
BEGIN
    FOR review_row IN SELECT * FROM vpreview ORDER BY "reviewVisitIdLegacy","reviewQADate" LOOP
        UPDATE vpmapped
            SET "mappedPoolStatus" = review_row."reviewPoolStatus"
        WHERE vpmapped."mappedPoolId" = review_row."reviewPoolId";
    END LOOP;
END;
$$ 
LANGUAGE plpgsql;

--reset all mappedPoolStatus to 'Potential' are repeat all status-change steps
UPDATE vpmapped SET "mappedPoolStatus"='Potential';

UPDATE vpmapped SET "mappedPoolStatus"='Probable' WHERE "mappedPoolId" LIKE '%KWN%';

SELECT set_mapped_status_from_review_status_all();

--list all pools having more than one review
SELECT "reviewId","reviewPoolId","reviewVisitIdLegacy","reviewUserName","reviewQAPerson","reviewQACode",
"reviewQADate","reviewQANotes","reviewPoolStatus"
FROM vpreview WHERE "reviewPoolId" IN (
	SELECT "reviewPoolId"
	FROM vpreview
	GROUP BY "reviewPoolId"
	HAVING count(*) > 1
) ORDER BY "reviewPoolId","reviewQADate","reviewVisitIdLegacy";

--We stored and used the legacy visit Id to associate vpreview rows with vpvisit rows.
--Since we created a new visitId and reviewId, both autoincrement in separate tables, now
--we associate rows using the old Ids, then apply the new foreign key constraint.
DROP FUNCTION IF EXISTS set_review_visit_id_using_visit_id_legacy;

UPDATE vpreview
	SET "reviewVisitId" =
		(SELECT "visitId" FROM vpvisit WHERE "visitIdLegacy"="reviewVisitIdLegacy");

SELECT "reviewVisitId","visitId","reviewVisitIdLegacy","visitIdLegacy" 
	FROM vpreview
		INNER JOIN vpvisit ON "visitIdLegacy"="reviewVisitIdLegacy";

ALTER TABLE vpreview
	ADD CONSTRAINT fk_visit_id
		FOREIGN KEY ("reviewVisitId")
			REFERENCES vpvisit ("visitId");

--DROP the original constraint. Now it's not needed, and it will prevent new reviews from being inserted.
ALTER TABLE vpreview DROP CONSTRAINT fk_visit_id_legacy;