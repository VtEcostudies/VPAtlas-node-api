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

--ALTER TABLE vptown ADD CONSTRAINT "fk_userid" FOREIGN KEY ("mappedUserId") REFERENCES vpuser ("userId");