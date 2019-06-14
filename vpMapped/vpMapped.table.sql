--ALTER TABLE vpmapped DROP CONSTRAINT IF EXISTS vpmapped_pkey;

--ALTER TABLE IF EXISTS vpmapped RENAME TO vpmapped_2;

CREATE TABLE IF NOT EXISTS vpmapped
(
	"mappedPoolId" text NOT NULL,
	"mappedByUser" text NOT NULL,
	"mappedByUserId" INTEGER DEFAULT 0,
	"mappedDateText" DATE,
	"mappedDateUnixSeconds" BIGINT,
    "mappedLatitude" numeric(11,8) NOT NULL,
    "mappedLongitude" numeric(11,8) NOT NULL,
	"mappedConfidence" confidence,
	"mappedSource" text,
	"mappedSource2" text,
	"mappedPhotoNumber" text,
	"mappedLocationAccuracy" text,
	"mappedShape" text,
	"mappedComments" text,
	"createdAt" timestamp default now(),
	"updatedAt" timestamp default now(),
    "mappedMethod" methodmapped,
    "mappedlocationInfoDirections" TEXT,
    "mappedLandownerPermission" boolean DEFAULT false,
    "mappedLandownerInfo" TEXT,
    "mappedLocationUncertainty" TEXT,
    "mappedTownId" INTEGER DEFAULT 0,
    "mappedPoolLocation" geometry(Point),
    "mappedPoolBorder" geometry(MultiPolygon),
    "mappedLandownerName" TEXT,
    "mappedLandownerAddress" TEXT,
    "mappedLandownerTown" TEXT,
    "mappedLandownerStateAbbrev" VARCHAR(2),
    "mappedLandownerZip5" INTEGER,
    "mappedLandownerPhone" TEXT,
    "mappedLandownerEmail" TEXT,
    "mappedPoolStatus" poolstatus DEFAULT 'Potential'::poolstatus,
    CONSTRAINT vpmapped_pkey PRIMARY KEY ("mappedPoolId"),
    CONSTRAINT fk_town_id FOREIGN KEY ("mappedTownId")
        REFERENCES public.vptown ("townId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

ALTER TABLE vpmapped OWNER TO vpatlas;