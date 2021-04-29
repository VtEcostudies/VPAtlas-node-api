--ALTER TABLE vpmapped DROP CONSTRAINT IF EXISTS vpmapped_pkey;

--DROP TABLE IF EXISTS vpmapped;

CREATE TABLE IF NOT EXISTS vpmapped
(
	"mappedPoolId" TEXT NOT NULL,
	"mappedByUser" TEXT NOT NULL,
	"mappedByUserId" INTEGER DEFAULT 0,
	"mappedDateText" DATE,
	"mappedDateUnixSeconds" BIGINT,
    "mappedLatitude" numeric(11,8) NOT NULL,
    "mappedLongitude" numeric(11,8) NOT NULL,
	"mappedConfidence" confidence,
	"mappedSource" TEXT,
	"mappedSource2" TEXT,
	"mappedPhotoNumber" TEXT,
	"mappedLocationAccuracy" TEXT,
	"mappedShape" TEXT,
	"mappedComments" TEXT,
	"createdAt" timestamp default now(),
	"updatedAt" timestamp default now(),
    "mappedMethod" TEXT,
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
    CONSTRAINT fk_user_id FOREIGN KEY ("mappedByUserId") REFERENCES vpuser ("id"),
    CONSTRAINT fk_town_id FOREIGN KEY ("mappedTownId") REFERENCES vptown ("townId")
);

ALTER TABLE vpmapped OWNER TO vpatlas;