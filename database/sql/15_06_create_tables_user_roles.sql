DROP TABLE IF EXISTS vpuser_role;
DROP TABLE IF EXISTS vpusers_roles;
DROP TABLE IF EXISTS vprole;

/*
	User roles table to support join tables for users and observers
*/
CREATE TABLE vprole (
	"roleId" INTEGER NOT NULL PRIMARY KEY,
	"roleName" TEXT NOT NULL UNIQUE,
	"roleDesc" TEXT
);
INSERT INTO vprole ("roleId", "roleName", "roleDesc") VALUES
(0, 'Observer', 'VPAtlas and VPMonitor Observer. Can be added as an Observer for Visits and Surveys.'),
(1, 'User', 'VPAtlas User - able to create new Visits and modify their own Visits.'),
(2, 'Monitor', 'Vernal Pool Monitor User - able to create new Surveys and modify their own Surveys for an assigned pool.'),
(3, 'Coordinator', 'Vernal Pool Monitor Coordinator - able to Review Surveys.'),
(4, 'Administrator', 'VPAtlas Administrator - able to Review Visits and Surveys.');

/*
	Join table associating users with roles in the system.

  NOTES:
    Users can be assigned more than one role. Initially,
    this is unnecessary, since roles are hierarchical, meaning that
    each higher role automatically inherits all the privileges of
    lesser roles.
*/
CREATE TABLE vpusers_roles (
	"userId" INTEGER NOT NULL REFERENCES vpuser("id"),
	"roleId" INTEGER NOT NULL REFERENCES vprole("roleId"),
  CONSTRAINT "vpuser_role_unique" UNIQUE("userId", "roleId")
);

ALTER TABLE vpmapped RENAME COLUMN "mappedByUserId" TO "mappedUserId";

ALTER TABLE vpmapped
	ADD CONSTRAINT "vpmapped_mappedUserId_fkey"
	FOREIGN KEY ("mappedUserId")
	REFERENCES vpuser ("id");

DROP FUNCTION IF EXISTS set_mapped_user_id_from_mapped_by_user();
CREATE OR REPLACE FUNCTION set_mapped_user_id_from_mapped_by_user()
    RETURNS trigger
		LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
	NEW."mappedUserId" = (SELECT "id" FROM vpuser WHERE "username"=NEW."mappedByUser");
	RAISE NOTICE 'set_mapped_user_id_from_mapped_by_user() userName:% | userId:%', NEW."mappedByUser", NEW."mappedUserId";
	RETURN NEW;
END;
$BODY$;

ALTER FUNCTION set_mapped_user_id_from_mapped_by_user()
    OWNER TO vpatlas;

DROP TRIGGER IF EXISTS trigger_before_insert_set_mapped_user_id_from_mapped_by_user ON vpsurvey;
CREATE TRIGGER trigger_before_insert_set_mapped_user_id_from_mapped_by_user BEFORE INSERT ON vpsurvey
  FOR EACH ROW EXECUTE PROCEDURE set_mapped_user_id_from_mapped_by_user();
DROP TRIGGER IF EXISTS trigger_before_update_set_mapped_user_id_from_mapped_by_user ON vpsurvey;
CREATE TRIGGER trigger_before_update_set_mapped_user_id_from_mapped_by_user BEFORE UPDATE ON vpsurvey
  FOR EACH ROW EXECUTE PROCEDURE set_mapped_user_id_from_mapped_by_user();

UPDATE vpmapped SET "mappedByUser"="mappedByUser";
