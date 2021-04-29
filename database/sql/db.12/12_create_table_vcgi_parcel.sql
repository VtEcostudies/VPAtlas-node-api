CREATE TABLE vcgi_parcel
(
    "vcgiTownId" integer,
    "vcgiTownName" character varying(100) COLLATE pg_catalog."default" NOT NULL,
    "vcgiParcel" jsonb
);

ALTER TABLE vcgi_parcel
    OWNER to vpatlas;

ALTER TABLE vcgi_parcel ADD CONSTRAINT vcgi_parcel_pkey PRIMARY KEY ("vcgiTownId");
ALTER TABLE vcgi_parcel ADD CONSTRAINT fk_town_id FOREIGN KEY ("vcgiTownId") REFERENCES vptown ("townId");
ALTER TABLE vcgi_parcel ADD CONSTRAINT unique_town_name UNIQUE("vcgiTownName");

-- function to alter incoming vcgiTownName to be upper case
CREATE OR REPLACE FUNCTION vcgi_town_name_to_upper()
RETURNS TRIGGER AS $$
BEGIN
   NEW."vcgiTownName" = upper(NEW."vcgiTownName"); 
   RETURN NEW;
END;
$$ language 'plpgsql';

--DROP TRIGGER IF EXISTS trigger_insert_vcgi_town_name_to_upper ON vcgi_parcel;
--DROP TRIGGER IF EXISTS trigger_update_vcgi_town_name_to_upper ON vcgi_parcel;

CREATE TRIGGER trigger_insert_vcgi_town_name_to_upper BEFORE INSERT
    ON vcgi_parcel FOR EACH ROW EXECUTE PROCEDURE 
    vcgi_town_name_to_upper();

CREATE TRIGGER trigger_update_vcgi_town_name_to_upper BEFORE UPDATE
    ON vcgi_parcel FOR EACH ROW EXECUTE PROCEDURE 
    vcgi_town_name_to_upper();
