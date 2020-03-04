alter table vpuser add column "token" varchar;
alter table vpuser rename column "createdat" to "createdAt";
alter table vpuser rename column "updatedat" to "updatedAt";

--create generic trigger function to set "updatedAt"=now() for each table having that column
CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS trigger
    LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
   NEW."updatedAt" = now(); 
   RETURN NEW;
END;
$BODY$;

--create triggers for each table having the column "updatedAt"
DROP TRIGGER IF EXISTS trigger_updated_at ON vpuser;
CREATE TRIGGER trigger_updated_at
    BEFORE UPDATE 
    ON vpuser
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();