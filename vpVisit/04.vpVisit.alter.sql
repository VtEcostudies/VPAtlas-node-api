--Alter vpvisit table to evolve data toward normalization
--As we make these alterations, add these changes to the table definition.
--To preserve the creation recipe so it will work to play it on the next server, comment-out the alterations in the table definition.
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
