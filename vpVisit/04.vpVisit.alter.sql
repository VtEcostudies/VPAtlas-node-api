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
