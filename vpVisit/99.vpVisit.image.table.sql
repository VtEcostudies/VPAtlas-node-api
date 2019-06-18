--create a separate table for vpVisit photos
DROP TABLE IF EXISTS vpvisit_image;

DROP SEQUENCE IF EXISTS vpvisit_image_visitimageid_seq;

CREATE TABLE vpvisit_image
(
    "visitImageId" SERIAL,
	"visitId" INTEGER NOT NULL,
	"visitImage" BLOB NOT NULL,
	"visitImageComments" TEXT,
	"visitImageCreatedAt" timestamp without time zone DEFAULT now(),
	"visitImageUpdatedAt" timestamp without time zone DEFAULT now(),
	CONSTRAINT vpvisit_image_pkey PRIMARY KEY ("visitImageId"),
	CONSTRAINT fk_visit_id FOREIGN KEY ("visitId") REFERENCES vpvisit ("visitId")
)
