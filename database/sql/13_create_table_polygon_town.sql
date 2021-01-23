create table gis_town (
	"gisTownId" integer NOT NULL,
    "townCentroid" geometry(Point),
    "townBorder" geometry(MultiPolygon),
    CONSTRAINT gis_town_pkey PRIMARY KEY ("gisTownId"),
    CONSTRAINT fk_gis_town_id FOREIGN KEY ("gisTownId") REFERENCES vptown ("townId")
)