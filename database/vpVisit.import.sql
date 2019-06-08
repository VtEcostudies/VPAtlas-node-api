truncate table vpvisit;

COPY vpvisit
(
"visitIdLegacy",
"visitUserName",
"visitNavMethod",
"visitCertainty",
"visitLocatePool",
"visitDate",
"visitTown",
"visitLocationComments",
"visitDirections",
"visitCoordsource",
"visitLatitude",
"visitLongitude",
"visitVernalPool",
"visitPoolType",
"visitInletType",
"visitOutletType",
"visitForestCondition",
"visitForestUpland",
"visitHabitatComment",
"visitHabitatAgriculture",
"visitHabitatLightDev",
"visitHabitatHeavyDev",
"visitHabitatPavedRd",
"visitHabitatDirtRd",
"visitHabitatPowerline",
"visitHabitatOther",
"visitMaxDepth",
"visitWaterLevelObs",
"visitHydroPeriod",
"visitMaxWidth",
"visitMaxLength",
"visitPoolTrees",
"visitPoolShrubs",
"visitPoolEmergents",
"visitPoolFloatingVeg",
"visitSubstrate",
"visitDisturbDumping",
"visitDisturbSiltation",
"visitDisturbVehicleRuts",
"visitDisturbRunoff",
"visitDisturbDitching",
"visitDisturbOther",
"visitWoodFrogsAdults",
"visitWoodFrogLarvae",
"visitWoodFrogEgg",
"visitWoodFrogEggHow",
"visitSpsAdults",
"visitSpsLarvae",
"visitSpsEgg",
"visitSpsEggHow",
"visitJesaAdults",
"visitJesaLarvae",
"visitJesaEgg",
"visitJesaEggHow",
"visitBssaAdults",
"visitBssaLarvae",
"visitBssaEgg",
"visitBssaEggHow",
"visitFairyShrimp",
"visitFingerNailClams",
"visitSpeciesOther1",
"visitSpeciesOther2",
"visitSpeciesComments",
"visitFish",
"visitFishCount",
"visitFishSizeSmall",
"visitFishSizeMedium",
"visitFishSizeLarge",
"visitPoolPhoto",
"visitPoolId",
"visitUserId",
"createdAt",
"updatedAt"
) FROM 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\vpvisit.20190608.csv' DELIMITER ',' CSV HEADER;