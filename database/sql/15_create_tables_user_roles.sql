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