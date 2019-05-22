--ALTER TABLE vpmapped DROP CONSTRAINT IF EXISTS vpmapped_pkey;

--ALTER TABLE IF EXISTS vpmapped RENAME TO vpmapped_2;

CREATE TABLE IF NOT EXISTS vpmapped
(
	"mappedPoolId" text NOT NULL,
	"mappedByUser" text,
	"mappedByUserId" integer,
	"mappedDateText" date,
	"mappedDateUnixSeconds" bigint,
	"mappedLatitude" real NOT NULL,
	"mappedLongitude" real NOT NULL,
	"mappedConfidence" text,
	"mappedSource" text,
	"mappedSource2" text,
	"mappedPhotoNumber" text,
	"mappedLocationAccuracy" text,
	"mappedShape" text,
	"mappedComments" text,
	"createdAt" timestamp default now(),
	"updatedAt" timestamp default now(),
	CONSTRAINT vpmapped_pkey PRIMARY KEY ("mappedPoolId")
);

ALTER TABLE vpmapped OWNER TO vpatlas;