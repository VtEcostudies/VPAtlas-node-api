SELECT
    row_to_json(fc) as geojson
FROM (
    SELECT
		'FeatureCollection' AS type,
		'Vermont Vernal Pool Atlas - Pool Visits' as name,
		--"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        array_to_json(array_agg(f)) AS features
    FROM (
        SELECT
            'Feature' AS type,
			ST_AsGeoJSON(ST_GeomFromText('POINT(' || "visitLongitude" || ' ' || "visitLatitude" || ')'))::json as geometry,
            (SELECT
			 	--note: comments fields can contain characters that are illegal for geoJSON
				row_to_json(p) FROM (SELECT 
					vpvisit."visitId",
					--vpvisit."visitIdLegacy",
					vpvisit."visitUserName",
					vpvisit."visitPoolId",
					vpvisit."visitNavMethod",
					vpvisit."visitCertainty",
					vpvisit."visitLocatePool",
					vpvisit."visitDate",
					--vpvisit."visitTownName", --BAD values
					--vpvisit."visitLocationComments", --BAD values
					--vpvisit."visitDirections", --BAD values
					vpvisit."visitCoordSource",
					--vpvisit."visitLatitude",
					--vpvisit."visitLongitude",
					vpvisit."visitVernalPool",
					vpvisit."visitPoolType",
					vpvisit."visitInletType",
					vpvisit."visitOutletType",
					vpvisit."visitForestCondition",
					vpvisit."visitForestUpland",
					--vpvisit."visitHabitatComment", --BAD values
					vpvisit."visitHabitatAgriculture",
					vpvisit."visitHabitatLightDev",
					vpvisit."visitHabitatHeavyDev",
					vpvisit."visitHabitatPavedRd",
					vpvisit."visitHabitatDirtRd",
					vpvisit."visitHabitatPowerline",
					vpvisit."visitHabitatOther",
					vpvisit."visitMaxDepth",
					vpvisit."visitWaterLevelObs",
					vpvisit."visitHydroPeriod",
					vpvisit."visitMaxWidth",
					vpvisit."visitMaxLength",
					vpvisit."visitPoolTrees",
					vpvisit."visitPoolShrubs",
					vpvisit."visitPoolEmergents",
					vpvisit."visitPoolFloatingVeg",
					vpvisit."visitSubstrate",
					vpvisit."visitDisturbDumping",
					vpvisit."visitDisturbSiltation",
					vpvisit."visitDisturbVehicleRuts",
					vpvisit."visitDisturbRunoff",
					vpvisit."visitDisturbDitching",
					vpvisit."visitDisturbOther",
					vpvisit."visitWoodFrogAdults",
					vpvisit."visitWoodFrogLarvae",
					vpvisit."visitWoodFrogEgg",
					vpvisit."visitWoodFrogEggHow",
					vpvisit."visitSpsAdults",
					vpvisit."visitSpsLarvae",
					vpvisit."visitSpsEgg",
					vpvisit."visitSpsEggHow",
					vpvisit."visitJesaAdults",
					vpvisit."visitJesaLarvae",
					vpvisit."visitJesaEgg",
					vpvisit."visitJesaEggHow",
					vpvisit."visitBssaAdults",
					vpvisit."visitBssaLarvae",
					vpvisit."visitBssaEgg",
					vpvisit."visitBssaEggHow",
					vpvisit."visitFairyShrimp",
					vpvisit."visitFingerNailClams",
					--vpvisit."visitSpeciesOther1",
					--vpvisit."visitSpeciesOther2",
					--vpvisit."visitSpeciesComments",
					vpvisit."visitFish",
					vpvisit."visitFishCount",
					vpvisit."visitFishSizeSmall",
					vpvisit."visitFishSizeMedium",
					vpvisit."visitFishSizeLarge",
					vpvisit."visitPoolPhoto",
					vpvisit."visitUserId",
					vpvisit."createdAt",
					vpvisit."updatedAt",
					vpvisit."visitPoolMapped",
					vpvisit."visitUserIsLandowner",
					vpvisit."visitLandownerPermission",
					--vpvisit."visitLandowner",
					vpvisit."visitTownId",
					vpvisit."visitFishSize",
					vpvisit."visitWoodFrogPhoto",
					vpvisit."visitWoodFrogNotes",
					vpvisit."visitSpsPhoto",
					--vpvisit."visitSpsNotes",
					vpvisit."visitJesaPhoto",
					--vpvisit."visitJesaNotes",
					vpvisit."visitBssaPhoto",
					--vpvisit."visitBssaNotes",
					vpvisit."visitFairyShrimpPhoto",
					--vpvisit."visitFairyShrimpNotes",
					vpvisit."visitFingerNailClamsPhoto",
					--vpvisit."visitFingerNailClamsNotes",
					vpvisit."visitNavMethodOther",
					vpvisit."visitPoolTypeOther",
					vpvisit."visitSubstrateOther",
					vpvisit."visitSpeciesOtherName",
					vpvisit."visitSpeciesOtherCount",
					vpvisit."visitSpeciesOtherPhoto",
					--vpvisit."visitSpeciesOtherNotes",
					vpvisit."visitLocationUncertainty",
					vpvisit."visitObserverUserName",
					vpvisit."visitWoodFrogiNat",
					vpvisit."visitSpsiNat",
					vpvisit."visitJesaiNat",
					vpvisit."visitBssaiNat",
					vpvisit."visitFairyShrimpiNat",
					vpvisit."visitFingerNailClamsiNat",
					vpvisit."visitSpeciesOtheriNat"
				  ) AS p
			) AS properties
        FROM vpvisit
    ) AS f
) AS fc;