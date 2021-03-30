create table geo_town (
	"geoTownId" integer NOT NULL,
	"geoTownPolygon" geometry(Geometry, 4326), --EPSG:4326 is WGS84 is ...
	CONSTRAINT geo_town_pkey PRIMARY KEY ("geoTownId"),
	CONSTRAINT fk_geo_town_id FOREIGN KEY ("geoTownId") REFERENCES vptown ("townId")
)
