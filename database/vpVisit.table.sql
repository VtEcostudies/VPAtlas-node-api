DROP TABLE IF EXISTS vpvisit;

DROP SEQUENCE IF EXISTS vpvisit_visitId_seq;

CREATE TABLE vpvisit
(
    "visitId" SERIAL,
    "visitIdLegacy" INTEGER,
    "visitUserName" TEXT,
    "visitPoolId" TEXT,
    "visitNavMethod" TEXT,
    "visitCertainty" TEXT,
    "visitLocatePool" TEXT,
    "visitDate" TEXT,
    "visitTown" TEXT,
    "visitLocationComments" TEXT,
    "visitDirections" TEXT,
    "visitCoordsource" TEXT,
    "visitLatitude" NUMERIC(11,8),
    "visitLongitude" NUMERIC(11,8),
    "visitVernalPool" TEXT,
    "visitPoolType" TEXT,
    "visitInletType" TEXT,
    "visitOutletType" TEXT,
    "visitForestCondition" TEXT,
    "visitForestUpland" TEXT,
    "visitHabitatComment" TEXT,
    "visitHabitatAgriculture" REAL,
    "visitHabitatLightDev" REAL,
    "visitHabitatHeavyDev" REAL,
    "visitHabitatPavedRd" REAL,
    "visitHabitatDirtRd" REAL,
    "visitHabitatPowerline" REAL,
    "visitHabitatOther" TEXT,
    "visitMaxDepth" TEXT,
    "visitWaterLevelObs" TEXT,
    "visitHydroPeriod" TEXT,
    "visitMaxWidth" TEXT,
    "visitMaxLength" TEXT,
    "visitPoolTrees" TEXT,
    "visitPoolShrubs" TEXT,
    "visitPoolEmergents" REAL,
    "visitPoolFloatingVeg" REAL,
    "visitSubstrate" TEXT,
    "visitDisturbDumping" REAL,
    "visitDisturbSiltation" REAL,
    "visitDisturbVehicleRuts" REAL,
    "visitDisturbRunoff" REAL,
    "visitDisturbDitching" REAL,
    "visitDisturbOther" TEXT,
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
    "visitUserId" INTEGER DEFAULT 0,
	"createdAt" TIMESTAMP DEFAULT NOW(),
	"updatedAt" TIMESTAMP DEFAULT NOW(),
    CONSTRAINT vpvisit_pkey PRIMARY KEY ("visitId"),
    CONSTRAINT "vpvisit_visitIdLegacy_key" UNIQUE ("visitIdLegacy")
	);