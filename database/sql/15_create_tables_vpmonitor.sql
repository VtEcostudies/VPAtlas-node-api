DROP TABLE IF EXISTS vpsurvey_users_roles;
DROP TABLE IF EXISTS vpusers_roles;
DROP TABLE IF EXISTS vprole;
DROP TABLE IF EXISTS vpsurvey_user_amphib_macro;
DROP TABLE IF EXISTS vpsurvey;
DROP TABLE IF EXISTS beaufort_wind_scale;
DROP TABLE IF EXISTS vpsurvey_type;

/*
  A vpsurvey_type defines the types of surveys performed on monitored vernal pools.
*/
CREATE TABLE vpsurvey_type (
	"surveyTypeId" INTEGER UNIQUE NOT NULL PRIMARY KEY,
	"surveyTypeName" TEXT NOT NULL UNIQUE,
	"surveyTypeDesc" TEXT
);
INSERT INTO vpsurvey_type ("surveyTypeId", "surveyTypeName", "surveyTypeDesc") VALUES
(1, 'Equipment Setup', 'The first visit of the spring.'),
(2, 'Early Survey', 'Survey the vernal pool for life soon after it thaws.'),
(3, 'Late Survey', 'Survey the vernal pool a few weeks after the Early Survey / Visit 2.'),
(4, 'Fall Visit', 'Reset the data logger (HOBO, AudioMoth or other) in the fall.'),
(9, 'Additional/Supplemental', 'Any non-essential visit to gather data, anecdotal information, or check on equipment.');

/*
  Create a definition table for the beaufort scale of wind strength.
*/
CREATE TABLE beaufort_wind_scale (
  "beaufortWindForce" INTEGER UNIQUE NOT NULL PRIMARY KEY,
  "beaufortWindMphMin" INTEGER,
  "beaufortWindMphMax" INTEGER,
  "beaufortWindName" TEXT NOT NULL UNIQUE,
  "beaufortWindDesc" TEXT
);
INSERT INTO beaufort_wind_scale ("beaufortWindForce", "beaufortWindMphMin", "beaufortWindMphMax", "beaufortWindName", "beaufortWindDesc") VALUES
(0, 0, 1, 'Calm', 'Calm. Smoke rises vertically.'),
(1, 1, 3, 'Light Air', 'Direction of wind shown by smoke drift, but not by wind vanes.'),
(2, 4, 7, 'Light Breeze', 'Wind felt on face. Leaves rustle. Ordinary vanes moved by wind.'),
(3, 8, 12, 'Gentle Breeze', 'Leaves and small twigs in constant motion. Wind extends light flag.'),
(4, 13, 18, 'Moderate Breeze', 'Raises dust and loose paper. Small branches are moved.'),
(5, 19, 24, 'Fresh Breeze', 'Small trees in leaf begin to sway. Crested wavelets form on inland waters.'),
(6, 25, 31, 'Strong Breeze', 'Large branches in motion. Whistling heard in telegraph wires. Umbrellas used with difficulty.'),
(7, 32, 38, 'Near Gale', 'Whole trees in motion. Inconvenience felt when walking against the wind.'),
(8, 39, 46, 'Gale', 'Breaks twigs off trees; generally impedes progress.'),
(9, 47, 54, 'Severe Gale', 'Slight structural damage occurs (chimney-pots and slates removed)'),
(10, 55, 63, 'Storm', 'Seldom experienced inland. Trees uprooted. Considerable structural damage occurs.'),
(11, 64, 72, 'Violent Storm', 'Very rarely experienced. Accompanied by wide-spread damage.'),
(12, 72, 83, 'Hurricane', 'See Saffir-Simpson Hurricane Scale');

/*
	A vpsurvey is a single pool-monitoring (survey) event.
	To group surveys into a pool-monitoring season we could:
		1) Create a join table, vpsurveys_types_year as set of surveys of a single pool done for one year.
		2) Simply add columns for surveyTypeId and surveyYear to the vpsurvey table

  NOTE: 'surveyUserId' refers to the user who entered data.
*/
create table vpsurvey (
  "surveyId" INTEGER UNIQUE NOT NULL PRIMARY KEY,
  "surveyUserId" INTEGER NOT NULL REFERENCES vpuser(id),
  "surveyPoolId" TEXT NOT NULL REFERENCES vpmapped ("mappedPoolId"),
  "surveyTypeId" INTEGER NOT NULL REFERENCES vpsurvey_type("surveyTypeId"),
  "surveyYear" INTEGER NOT NULL,
  "surveyDateTime" TIMESTAMP NOT NULL,
  "surveyTownId" INTEGER NOT NULL REFERENCES vptown("townId"),
  "surveyLocation" geometry(Point),
  "surveyBorder" geometry(MultiPolygon),
  "surveyIceCover" INTEGER DEFAULT 0,
  "surveyWaterLevel" INTEGER DEFAULT 0,
  "surveySubmergedVeg" INTEGER DEFAULT 0,
  "surveyFloatingVeg" INTEGER DEFAULT 0,
  "surveyEmergentVeg" INTEGER DEFAULT 0,
  "surveyShrubs" INTEGER DEFAULT 0,
  "surveyTrees" INTEGER DEFAULT 0,
  "surveyPhysicalParametersNotes" TEXT,
  "surveyAirTempF" INTEGER,
  "surveyHumidity" INTEGER,
  "surveyWindBeaufort" INTEGER REFERENCES beaufort_wind_scale("beaufortWindForce"),
  "surveyWeatherConditions" TEXT,
  "surveyWeatherNotes" TEXT,
  "surveySpermatophores" BOOLEAN DEFAULT false,
  "surveyAmphibMacroNotes" TEXT,
  "surveyEdgeVisualImpairment" INTEGER DEFAULT 0,
  "surveyInteriorVisualImpairment" INTEGER DEFAULT 0
  --Acoustic Monitor
  --HOBO logger
  --HOBO data
);

/*
  Breakout / join table for Observers 1 & 2 amphibian and macro invertebrate surveys.

  NOTES:
    Users here are Observers.
    photoUrls are text arrays, allowing multiple values for each column.
*/
CREATE TABLE vpsurvey_user_amphib_macro (
  "amphibMacroSurveyId" INTEGER NOT NULL REFERENCES vpsurvey("surveyId"),
  "amphibMacroSurveyUserId" INTEGER NOT NULL REFERENCES vpuser(id),
  "polarizedGlasses" BOOLEAN DEFAULT false,
  "edgeStart" TIMESTAMP NOT NULL,
  "edgeWOFR" INTEGER DEFAULT 0,
  "edgeSPSA" INTEGER DEFAULT 0,
  "edgeJESA" INTEGER DEFAULT 0,
  "edgeBLSA" INTEGER DEFAULT 0,
  "interiorStart" TIMESTAMP NOT NULL,
  "interiorWOFR" INTEGER DEFAULT 0,
  "interiorSPSA" INTEGER DEFAULT 0,
  "interiorJESA" INTEGER DEFAULT 0,
  "interiorBLSA" INTEGER DEFAULT 0,
  "northFairyShrimp" INTEGER DEFAULT 0,
  "eastFairyShrimp" INTEGER DEFAULT 0,
  "southFairyShrimp" INTEGER DEFAULT 0,
  "westFairyShrimp" INTEGER DEFAULT 0,
  "totalFairyShrimp" INTEGER DEFAULT 0,
  "northCaddisfly" INTEGER DEFAULT 0,
  "eastCaddisfly" INTEGER DEFAULT 0,
  "southCaddisfly" INTEGER DEFAULT 0,
  "westCaddisfly" INTEGER DEFAULT 0,
  "totalCaddisfly" INTEGER DEFAULT 0,
  "photoUrlInteriorWOFR" TEXT[],
  "photoUrlInteriorSPSA" TEXT[],
  "photoUrlInteriorJESA" TEXT[],
  "photoUrlInteriorBLSA" TEXT[],
  "photoUrlEdgeWOFR" TEXT[],
  "photoUrlEdgeSPSA" TEXT[],
  "photoUrlEdgeJESA" TEXT[],
  "photoUrlEdgeBLSA" TEXT[],
  "photoUrlFairyShrimp" TEXT[],
  "photoUrlCaddisfly" TEXT[]
);

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
	Administrative join table associating users with roles in the system.
*/
CREATE TABLE vpusers_roles (
	"userId" INTEGER NOT NULL REFERENCES vpuser("id"),
	"roleId" INTEGER NOT NULL REFERENCES vprole("roleId")
);

/*
	Join table for survey users and survey observers.

  This is not needed. Handled in vpsurvey_user_amphib_macro
*/
/*
create table vpsurvey_users_roles (
	"userRoleSurveyId" integer NOT NULL REFERENCES vpsurvey("surveyId"),
	"surveyUserId" integer NOT NULL REFERENCES vpuser(id),
	"surveyUserRoleId" integer NOT NULL REFERENCES vpuser_role("roleId")
);
*/
