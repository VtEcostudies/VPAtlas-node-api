DROP TABLE IF EXISTS vpvisit;

DROP SEQUENCE IF EXISTS vpvisit_visitId_seq;

CREATE TABLE vpvisit
(
    "visitId" SERIAL,
    "visitIdLegacy" INTEGER,
--1a Observer Information
--1b Credentials
    "visitUserName" TEXT,
    "visitUserId" INTEGER DEFAULT 0,
--2a Vernal Pool Location Information
    "visitPoolId" TEXT,
    "visitDate" TEXT,
    --"visitPoolMapped" TEXT, --a new field to capture question: Mapped potential or unmapped?
    "visitLocatePool" TEXT,
    "visitCertainty" TEXT,
    "visitNavMethod" TEXT,
    "visitDirections" TEXT,
    "visitTown" TEXT,
    "visitLocationComments" TEXT,
--2b Location of Pool
    "visitCoordsource" TEXT,
    "visitLatitude" NUMERIC(11,8),
    "visitLongitude" NUMERIC(11,8),
--2c Landowner Contact Information - add in vpvisit.alter.sql
    --"visitUserIsLandowner" BOOLEAN DEFAULT FALSE,
    --"visitLandownerPermission" BOOLEAN DEFAULT FALSE,
    --"visitLandowner" JSONB, --JSON object of landowner data
--3 Vernal Pool Field-Verification Informtion
--3a Pool Type
    "visitVernalPool" TEXT,
    "visitPoolType" TEXT,
--3b Presence of Inlet and/or Outlet
    "visitInletType" TEXT,
    "visitOutletType" TEXT,
--3c Surrounding Habitat
    "visitForestUpland" TEXT,
    "visitForestCondition" TEXT,
    "visitHabitatAgriculture" REAL,
    "visitHabitatLightDev" REAL,
    "visitHabitatHeavyDev" REAL,
    "visitHabitatPavedRd" REAL,
    "visitHabitatDirtRd" REAL,
    "visitHabitatPowerline" REAL,
    "visitHabitatOther" TEXT,
    "visitHabitatComment" TEXT,
--4 Pool Characteristics
--4a ENUM Type Approximate Maximum Pool Depth
    "visitMaxDepth" TEXT,
--4b ENUM Type Water Level at Time of Survey
    "visitWaterLevelObs" TEXT,
--4c ENUM Type
    "visitHydroPeriod" TEXT,
--4d INTEGER feet
    "visitMaxWidth" TEXT,
    "visitMaxLength" TEXT,
--4e % values - use REAL or NUMERIC
    "visitPoolTrees" TEXT,
    "visitPoolShrubs" TEXT,
    "visitPoolEmergents" REAL,
    "visitPoolFloatingVeg" REAL,
--4f ENUM Type w/ other
    "visitSubstrate" TEXT,
--4g ENUM Type w/ other
    "visitDisturbDumping" REAL,
    "visitDisturbSiltation" REAL,
    "visitDisturbVehicleRuts" REAL,
    "visitDisturbRunoff" REAL,
    "visitDisturbDitching" REAL,
    "visitDisturbOther" TEXT,
--5 Indicator Species
    "visitWoodFrogsAdults" REAL,
    "visitWoodFrogLarvae" REAL,
    "visitWoodFrogEgg" REAL,
    "visitWoodFrogEggHow" TEXT,
    "visitSpsAdults" REAL,
    "visitSpsLarvae" REAL,
    "visitSpsEgg" REAL,
    "visitSpsEggHow" TEXT,
    "visitJesaAdults" REAL,
    "visitJesaLarvae" REAL,
    "visitJesaEgg" REAL,
    "visitJesaEggHow" TEXT,
    "visitBssaAdults" REAL,
    "visitBssaLarvae" REAL,
    "visitBssaEgg" REAL,
    "visitBssaEggHow" TEXT,
    "visitFairyShrimp" REAL,
    "visitFingerNailClams" REAL,
    "visitSpeciesOther1" TEXT,
    "visitSpeciesOther2" TEXT,
    "visitSpeciesComments" TEXT,
    "visitFish" REAL,
    "visitFishCount" REAL,
    "visitFishSizeSmall" REAL,
    "visitFishSizeMedium" REAL,
    "visitFishSizeLarge" REAL,
    "visitPoolPhoto" TEXT,
	"createdAt" TIMESTAMP DEFAULT NOW(),
	"updatedAt" TIMESTAMP DEFAULT NOW(),
    CONSTRAINT vpvisit_pkey PRIMARY KEY ("visitId"),
    CONSTRAINT "vpvisit_visitIdLegacy_key" UNIQUE ("visitIdLegacy")
	);