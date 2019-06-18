--NOTE: DON'T USE BACKSLASH COMMENTS IN THESE SCRIPTS. IT CAUSES ERRORS.

ALTER TABLE vpmapped ALTER COLUMN "mappedLatitude" TYPE NUMERIC(11,8);
ALTER TABLE vpmapped ALTER COLUMN "mappedLongitude" TYPE NUMERIC(11,8);

--reload vpmapped - lat and lon were truncated by column type real
TRUNCATE TABLE vpmapped;

--had to fix-up CSV file for re-import. made columns NOT NULL, etc.
COPY vpmapped(
	"mappedPoolId",
	"mappedByUser",
	"mappedByUserId",
	"mappedDateText",
	"mappedDateUnixSeconds",
	"mappedLatitude",
	"mappedLongitude",
	"mappedConfidence",
	"mappedSource",
	"mappedSource2",
	"mappedPhotoNumber",
	"mappedLocationAccuracy",
	"mappedShape",
	"mappedComments",
	"createdAt",
	"updatedAt"        
)FROM 'vpmapped.20190607.csv' DELIMITER ',' CSV HEADER;

--unique email. unique first, last?, first, last, email?
ALTER TABLE vpuser ADD CONSTRAINT unique_email UNIQUE(email);

INSERT INTO vpuser (id, username, hash, firstname, lastname, email, userrole) 
VALUES (0,'Unknown','12345678','Unknown','Unknown','Unknown@unknown.org','Guest');

ALTER TABLE vpuser ADD COLUMN "middleName" TEXT;
ALTER TABLE vpuser ADD CONSTRAINT "vpuser_id_unique_key" UNIQUE("id");

--these alterations were moved to vpvisit.alter.1.sql
--ALTER TABLE vpvisit ADD CONSTRAINT fk_vpvisit_vpmapped_poolid FOREIGN KEY ("visitPoolId") REFERENCES vpmapped ("mappedPoolId");
--ALTER TABLE vpvisit ADD CONSTRAINT fk_vpvisit_vpuser_id FOREIGN KEY ("visitUserId") REFERENCES vpuser ("id");

--ALTER TABLE vptown ADD CONSTRAINT "fk_userid" FOREIGN KEY ("mappedUserId") REFERENCES vpuser ("userId");