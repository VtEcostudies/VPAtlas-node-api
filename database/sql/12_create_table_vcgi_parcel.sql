CREATE TABLE vcgi_parcel
(
    "vcgiTownId" integer,
    "vcgiTownName" character varying(100) COLLATE pg_catalog."default" NOT NULL,
    "vcgiParcel" jsonb
)

ALTER TABLE vcgi_parcel
    OWNER to postgres;