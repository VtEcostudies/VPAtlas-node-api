DROP TABLE IF EXISTS vpuser_role;
DROP TABLE IF EXISTS vpusers_roles;
DROP TABLE IF EXISTS vprole;

/*
	User roles table to support join tables for users and observers
*/
CREATE TABLE vprole (
	"role" TEXT NOT NULL PRIMARY KEY,
	"roleDesc" TEXT
);
INSERT INTO vprole ("role", "roleDesc") VALUES
('Observer', 'VPAtlas and VPMonitor Observer. Can be added as an Observer for Visits and Surveys.'),
('User', 'VPAtlas User - able to create new Visits and modify their own Visits.'),
('Monitor', 'Vernal Pool Monitor User - able to create new Surveys and modify their own Surveys for an assigned pool.'),
('Coordinator', 'Vernal Pool Monitor Coordinator - able to Review Surveys.'),
('Administrator', 'VPAtlas Administrator - able to Review Visits and Surveys.');

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
	"role" TEXT NOT NULL REFERENCES vprole("role"),
  CONSTRAINT "vpuser_role_unique" UNIQUE("userId", "role")
);
