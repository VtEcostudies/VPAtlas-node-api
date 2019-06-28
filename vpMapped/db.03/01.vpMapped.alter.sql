--fix townId to not allow nulls
UPDATE vpmapped SET "mappedTownId"=0 WHERE "mappedTownId" is NULL;
ALTER TABLE vpmapped ALTER COLUMN "mappedTownId" SET NOT NULL;

--add a function and trigger to auto-generate a pool ID for NEW* pools
CREATE OR REPLACE FUNCTION generate_new_pool_id()
RETURNS TRIGGER AS $$
DECLARE
	next_int integer;
	next_val text;
BEGIN
	--check to see if this is a NEW* pool
	IF (substr(NEW."mappedPoolId",1,3) = 'NEW') THEN
	
		SELECT max(new_val) AS new_max FROM (
			SELECT 
				"mappedPoolId", 
				TO_NUMBER(substr("mappedPoolId",4,10), '99999') AS new_val
			FROM vpmapped
			WHERE "mappedPoolId" LIKE 'NEW%'
		) max_new
		INTO next_int;
		
		next_int := next_int + 1;
		next_val := concat('NEW', next_int::TEXT );
		
		NEW."mappedPoolId" := next_val;

	END IF;
	
	RETURN NEW;
END;
$$ language 'plpgsql';

--trigger before INSERT only
CREATE TRIGGER trigger_insert_new_pool BEFORE INSERT
    ON vpmapped FOR EACH ROW EXECUTE PROCEDURE 
    generate_new_pool_id();

/*
SELECT max(new_val) AS new_max FROM (
	SELECT 
		"mappedPoolId", 
		TO_NUMBER(substr("mappedPoolId",4,10), '99999') AS new_val
	FROM vpmapped
	WHERE "mappedPoolId" LIKE 'NEW%'
) max_new;
*/