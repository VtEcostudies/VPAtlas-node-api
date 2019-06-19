--Alter vpvisit table to evolve data toward normalization
--As we make these alterations, add these changes to the table definition.
--To preserve the creation recipe so it will work to play it on the next server, comment-out the alterations in the table definition.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_updated_at BEFORE UPDATE
    ON vpvisit FOR EACH ROW EXECUTE PROCEDURE 
    set_updated_at();

ALTER TABLE vpvisit ADD CONSTRAINT fk_vpvisit_vpmapped_poolid FOREIGN KEY ("visitPoolId") REFERENCES vpmapped ("mappedPoolId");
ALTER TABLE vpvisit ADD CONSTRAINT fk_vpvisit_vpuser_id FOREIGN KEY ("visitUserId") REFERENCES vpuser ("id");

ALTER TABLE vpvisit ADD COLUMN "visitPoolMapped" BOOLEAN DEFAULT TRUE;
ALTER TABLE vpvisit ADD COLUMN "visitUserIsLandowner" BOOLEAN DEFAULT FALSE;
ALTER TABLE vpvisit ADD COLUMN "visitLandownerPermission" BOOLEAN DEFAULT FALSE;
ALTER TABLE vpvisit ADD COLUMN "visitLandownerId" INTEGER DEFAULT 0; --Foreign Key to Landowner Contact Info
ALTER TABLE vpvisit DROP COLUMN IF EXISTS "visitLandownerId";
ALTER TABLE vpvisit ADD COLUMN "visitLandowner" JSONB;

ALTER TABLE vpvisit ALTER COLUMN "visitHabitatAgriculture" TYPE BOOLEAN USING CASE WHEN "visitHabitatAgriculture"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatAgriculture" SET DEFAULT FALSE;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatLightDev" TYPE BOOLEAN USING CASE WHEN "visitHabitatLightDev"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatLightDev" SET DEFAULT FALSE;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatHeavyDev" TYPE BOOLEAN USING CASE WHEN "visitHabitatHeavyDev"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatHeavyDev" SET DEFAULT FALSE;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatPavedRd" TYPE BOOLEAN USING CASE WHEN "visitHabitatPavedRd"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatPavedRd" SET DEFAULT FALSE;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatDirtRd" TYPE BOOLEAN USING CASE WHEN "visitHabitatDirtRd"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatDirtRd" SET DEFAULT FALSE;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatPowerline" TYPE BOOLEAN USING CASE WHEN "visitHabitatPowerline"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitHabitatPowerline" SET DEFAULT FALSE;

ALTER TABLE vpvisit ALTER COLUMN "visitMaxWidth" TYPE INTEGER USING CAST("visitMaxWidth" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitMaxWidth" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitMaxLength" TYPE INTEGER USING CAST("visitMaxLength" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitMaxLength" SET DEFAULT 0;

ALTER TABLE vpvisit ALTER COLUMN "visitPoolTrees" TYPE REAL USING CAST("visitPoolTrees" AS REAL);
ALTER TABLE vpvisit ALTER COLUMN "visitPoolTrees" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitPoolShrubs" TYPE REAL USING CAST("visitPoolShrubs" AS REAL);
ALTER TABLE vpvisit ALTER COLUMN "visitPoolShrubs" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitPoolEmergents" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitPoolFloatingVeg" SET DEFAULT 0;

ALTER TABLE vpvisit ALTER COLUMN "visitDisturbDumping" TYPE BOOLEAN USING CASE WHEN "visitDisturbDumping"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitDisturbDumping" SET DEFAULT FALSE;
ALTER TABLE vpvisit ALTER COLUMN "visitDisturbSiltation" TYPE BOOLEAN USING CASE WHEN "visitDisturbSiltation"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitDisturbSiltation" SET DEFAULT FALSE;
ALTER TABLE vpvisit ALTER COLUMN "visitDisturbVehicleRuts" TYPE BOOLEAN USING CASE WHEN "visitDisturbVehicleRuts"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitDisturbVehicleRuts" SET DEFAULT FALSE;
ALTER TABLE vpvisit ALTER COLUMN "visitDisturbRunoff" TYPE BOOLEAN USING CASE WHEN "visitDisturbRunoff"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitDisturbRunoff" SET DEFAULT FALSE;
ALTER TABLE vpvisit ALTER COLUMN "visitDisturbDitching" TYPE BOOLEAN USING CASE WHEN "visitDisturbDitching"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitDisturbDitching" SET DEFAULT FALSE;

--normalize pools - this should go with the code that created pools from new-pool visits
ALTER TABLE vpvisit ADD CONSTRAINT "fk_pool_id" FOREIGN KEY ("visitPoolId") REFERENCES vpmapped ("mappedPoolId");

--normalize users - at this point all visitUserIds=0
ALTER TABLE vpvisit ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("visitUserId") REFERENCES vpuser ("id");
--TODO:
-- generate users from mappedUser and visitUsers
-- update all userIds in those tables
-- alter the UI to load vpuser as object having {id: x, name: y, role: z}

--add visitTownId to get ready for normalized towns
ALTER TABLE vpvisit ADD COLUMN "visitTownId" INTEGER DEFAULT 0;
ALTER TABLE vpvisit ADD CONSTRAINT "fk_town_id" FOREIGN KEY ("visitTownId") REFERENCES vptown ("townId");

ALTER TABLE vpvisit ALTER COLUMN "visitWoodFrogsAdults" TYPE INTEGER USING CAST("visitWoodFrogsAdults" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitWoodFrogsAdults" SET DEFAULT 0;
ALTER TABLE vpvisit RENAME COLUMN "visitWoodFrogsAdults" TO "visitWoodFrogAdults";
ALTER TABLE vpvisit ALTER COLUMN "visitWoodFrogLarvae" TYPE INTEGER USING CAST("visitWoodFrogLarvae" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitWoodFrogLarvae" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitWoodFrogEgg" TYPE INTEGER USING CAST("visitWoodFrogEgg" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitWoodFrogEgg" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitSpsAdults" TYPE INTEGER USING CAST("visitSpsAdults" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitSpsAdults" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitSpsLarvae" TYPE INTEGER USING CAST("visitSpsLarvae" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitSpsLarvae" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitSpsEgg" TYPE INTEGER USING CAST("visitSpsEgg" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitSpsEgg" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitJesaAdults" TYPE INTEGER USING CAST("visitJesaAdults" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitJesaAdults" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitJesaLarvae" TYPE INTEGER USING CAST("visitJesaLarvae" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitJesaLarvae" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitJesaEgg" TYPE INTEGER USING CAST("visitJesaEgg" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitJesaEgg" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitBssaAdults" TYPE INTEGER USING CAST("visitBssaAdults" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitBssaAdults" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitBssaLarvae" TYPE INTEGER USING CAST("visitBssaLarvae" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitBssaLarvae" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitBssaEgg" TYPE INTEGER USING CAST("visitBssaEgg" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitBssaEgg" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitFairyShrimp" TYPE INTEGER USING CAST("visitFairyShrimp" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitFairyShrimp" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitFingerNailClams" TYPE INTEGER USING CAST("visitFingerNailClams" AS integer);
ALTER TABLE vpvisit ALTER COLUMN "visitFingerNailClams" SET DEFAULT 0;
ALTER TABLE vpvisit ALTER COLUMN "visitFish" TYPE BOOLEAN USING CASE WHEN "visitFish"=0 THEN FALSE ELSE TRUE END;
ALTER TABLE vpvisit ALTER COLUMN "visitFish" SET DEFAULT FALSE;
ALTER TABLE vpvisit ALTER COLUMN "visitFishCount" TYPE TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitFishSize" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitWoodFrogPhoto" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitWoodFrogNotes" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitSpsPhoto" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitSpsNotes" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitJesaPhoto" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitJesaNotes" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitBssaPhoto" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitBssaNotes" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitFairyShrimpPhoto" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitFairyShrimpNotes" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitFingerNailClamsPhoto" TEXT;
ALTER TABLE vpvisit ADD COLUMN "visitFingerNailClamsNotes" TEXT;
