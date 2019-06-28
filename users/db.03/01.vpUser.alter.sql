--add createdAt and updatedAt to vpUser
ALTER TABLE vpuser ADD COLUMN "createdAt" timestamp default now();
ALTER TABLE vpuser ADD COLUMN "updatedAt" timestamp default now();

CREATE TRIGGER trigger_updated_at BEFORE UPDATE
    ON vpuser FOR EACH ROW EXECUTE PROCEDURE 
    set_updated_at();

ALTER TABLE vpuser ADD COLUMN "userPhone" TEXT;
ALTER TABLE vpuser ADD COLUMN "userAddress" TEXT;
ALTER TABLE vpuser ADD COLUMN "userCredentials" TEXT;
ALTER TABLE vpuser ADD COLUMN "userTrained" BOOLEAN;