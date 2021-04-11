ALTER TABLE vpcounty DROP COLUMN "countyCentroid";
ALTER TABLE vpcounty DROP COLUMN "countyBorder";

create table vpstate (
	"stateId" SERIAL,
	"stateName" TEXT NOT NULL,
	CONSTRAINT state_pkey PRIMARY KEY ("stateId"),
);
INSERT INTO vpstate ("stateId", "stateName")
VALUES
(1, 'Vermont');

--DROP TABLE geo_state;
create table geo_state (
	"geoId" integer NOT NULL,
	"geoPolygon" geometry(Geometry, 4326),
	CONSTRAINT geo_state_pkey PRIMARY KEY ("geoId"),
	CONSTRAINT fk_geo_state_id FOREIGN KEY ("geoId") REFERENCES vpstate ("stateId")
)
--TRUNCATE TABLE geo_;

--DROP TABLE geo_town;
create table geo_county (
	"geoId" integer NOT NULL,
	"geoPolygon" geometry(Geometry, 4326),
	CONSTRAINT geo_county_pkey PRIMARY KEY ("geoId"),
	CONSTRAINT fk_geo_county_id FOREIGN KEY ("geoId") REFERENCES vpcounty ("govCountyId") --we use VCGI's County Ids because our vptowns use those
);
--TRUNCATE TABLE geo_county;

create table vpbiophysical (
	"biophysicalId" SERIAL,
	"biophysicalName" TEXT NOT NULL,
	CONSTRAINT biophysical_pkey PRIMARY KEY ("biophysicalId"),
);
INSERT INTO vpbiophysical ("biophysicalId", "biophysicalName")
VALUES
(1, 'Champlain Hills'),
(2, 'Champlain Valley'),
(3, 'Northeastern Highlands'),
(4, 'Northern Green Mountains'),
(5, 'Northern Vermont Piedmont'),
(6, 'Southern Green Mountains'),
(7, 'Southern Vermont Piedmont'),
(8, 'Taconic Mountains'),
(9, 'Taconic Mountains South'),
(10, 'Vermont Valley');

--DROP TABLE geo_biophysical;
create table geo_biophysical (
	"geoId" integer NOT NULL,
	"geoPolygon" geometry(Geometry, 4326),
	CONSTRAINT geo_biophysical_pkey PRIMARY KEY ("geoId"),
	CONSTRAINT fk_geo_biophysical_id FOREIGN KEY ("geoId") REFERENCES vpbiophysical ("biophysicalId")
)
--TRUNCATE TABLE geo_biophysical;
