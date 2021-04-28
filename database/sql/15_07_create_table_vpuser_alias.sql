
/*
	Keep the 'alias' field in vpuser, but ADD a table to manage and use them
	We use a TRIGGER to maintain vpuser_alias from vpuer(alias).
*/
CREATE TABLE vpuser_alias (
	"alias" TEXT NOT NULL UNIQUE PRIMARY KEY,
	"aliasUserId" INTEGER NOT NULL REFERENCES vpuser("id")
);

ALTER TABLE vpmapped RENAME COLUMN "mappedByUserId" TO "mappedUserId";

ALTER TABLE vpmapped
	ADD CONSTRAINT "vpmapped_mappedUserId_fkey"
	FOREIGN KEY ("mappedUserId")
	REFERENCES vpuser ("id");

--DROP FUNCTION IF EXISTS set_vpuser_alias_rows_from_vpuser_array();
CREATE OR REPLACE FUNCTION set_vpuser_alias_rows_from_vpuser_array()
    RETURNS trigger
		LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
	alias text;
BEGIN
	DELETE FROM vpuser_alias WHERE "aliasUserId"=NEW."id";
	RAISE NOTICE 'Alias Array %', NEW."alias";
	FOR i IN array_lower(NEW.alias, 1) .. array_upper(NEW.alias, 1)
	LOOP
		RAISE NOTICE 'alias: %', NEW.alias[i];
		INSERT INTO vpuser_alias ("aliasUserId", "alias") VALUES (NEW."id", NEW.alias[i]);
	END LOOP;

	RETURN NEW;
END;
$BODY$;

ALTER FUNCTION set_vpuser_alias_rows_from_vpuser_array()
    OWNER TO vpatlas;

DROP TRIGGER IF EXISTS trigger_after_insert_set_vpuser_alias_rows_from_vpuser_array ON vpuser;
CREATE TRIGGER trigger_before_insert_set_vpuser_alias_rows_from_vpuser_array AFTER INSERT ON vpuser
  FOR EACH ROW EXECUTE PROCEDURE set_vpuser_alias_rows_from_vpuser_array();
DROP TRIGGER IF EXISTS trigger_after_update_set_vpuser_alias_rows_from_vpuser_array ON vpuser;
CREATE TRIGGER trigger_before_update_set_vpuser_alias_rows_from_vpuser_array AFTER UPDATE ON vpuser
  FOR EACH ROW EXECUTE PROCEDURE set_vpuser_alias_rows_from_vpuser_array();

--DROP FUNCTION IF EXISTS set_mapped_user_id_from_mapped_by_user();
CREATE OR REPLACE FUNCTION set_mapped_user_id_from_mapped_by_user()
    RETURNS trigger
		LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
	--SELECT DISTINCT below to limit results to a single value
	--It's critical that both username and alias are unique so we don't have
	--mis-matches here.
	NEW."mappedUserId" = (
		SELECT DISTINCT(vpuser."id") FROM vpuser
		LEFT JOIN vpuser_alias ON "aliasUserId"="id"
		WHERE vpuser."username"=NEW."mappedByUser"
		OR vpuser_alias."alias"=NEW."mappedByUser"
	);
	RAISE NOTICE 'set_mapped_user_id_from_mapped_by_user() userName:% | userId:%', NEW."mappedByUser", NEW."mappedUserId";
	RETURN NEW;
END;
$BODY$;

ALTER FUNCTION set_mapped_user_id_from_mapped_by_user()
    OWNER TO vpatlas;

DROP TRIGGER IF EXISTS trigger_before_insert_set_mapped_user_id_from_mapped_by_user ON vpmapped;
CREATE TRIGGER trigger_before_insert_set_mapped_user_id_from_mapped_by_user BEFORE INSERT ON vpmapped
  FOR EACH ROW EXECUTE PROCEDURE set_mapped_user_id_from_mapped_by_user();
DROP TRIGGER IF EXISTS trigger_before_update_set_mapped_user_id_from_mapped_by_user ON vpmapped;
CREATE TRIGGER trigger_before_update_set_mapped_user_id_from_mapped_by_user BEFORE UPDATE ON vpmapped
  FOR EACH ROW EXECUTE PROCEDURE set_mapped_user_id_from_mapped_by_user();

SELECT * FROM vpmapped WHERE "mappedByUser" LIKE '%SDF%' AND "mappedByUser" != 'SDF';

INSERT INTO vpuser_alias ("alias", "aliasUserId") VALUES
('SDF', (SELECT id from vpuser WHERE email='sfaccio@vtecostudies.org')),
('sfaccio', (SELECT id from vpuser WHERE email='sfaccio@vtecostudies.org'));

UPDATE vpmapped SET "mappedByUser"="mappedByUser"; --WHERE "mappedPoolId"='SDF100';

--test query
SELECT "id" FROM vpuser
INNER JOIN vpuser_alias ON "aliasUserId"="id"
WHERE "username"='SDF'
OR "alias"='SDF';

select "mappedPoolId", "mappedByUser", id, username, email from vpmapped
inner join vpuser ON "mappedUserId"=id
WHERE id != 0 ;
