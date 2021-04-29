/*
  Pool IDs can be manually entered by Administrators, allowing them to choose
  *any* value. This function failed when the prefix 'NEW' was followed by a
  non-numeric value.

  Since this only tries to find a reasonable value in a sequence of numbers,
  to append to 'NEW', excluding non-numeric values works fine.

  Changed WHERE clause from "LIKE 'NEW%'" to "~ '^NEW[0-9]'"

  I tested this against the current LIVE DB, and it worked, but it hasn't
  been tested more broadly.
*/
CREATE OR REPLACE FUNCTION generate_new_pool_id()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
DECLARE
	next_int integer;
	next_val text;
BEGIN
	--check to see if this is a NEW* pool
	IF (substr(NEW."mappedPoolId",1,4) = 'NEW*') THEN

		SELECT max(new_val) AS new_max FROM (
			SELECT
				"mappedPoolId",
				TO_NUMBER(substr("mappedPoolId",4,10), '99999') AS new_val
			FROM vpmapped
			WHERE "mappedPoolId" ~ '^NEW[0-9]'
		) max_new
		INTO next_int;

		next_int := next_int + 1;
		next_val := concat('NEW', next_int::TEXT );

		NEW."mappedPoolId" := next_val;

	END IF;

	RETURN NEW;
END;
$BODY$;
