--DROP TABLE IF EXISTS vpreview;

--DROP SEQUENCE IF EXISTS vpreview_reqviewId_seq;

CREATE TABLE vpreview
(
    "reviewId" SERIAL UNIQUE NOT NULL,
    "reviewUserName" TEXT NOT NULL,
    "reviewUserId" INTEGER DEFAULT 0,
    "reviewPoolId" TEXT NOT NULL,
    "reviewVisitIdLegacy" INTEGER NOT NULL,
    "reviewVisitId" INTEGER DEFAULT 0,
    "reviewQACode" TEXT,
    "reviewQAAlt" TEXT,
    "reviewQAPerson" TEXT,
    "reviewQADate" DATE,
    "reviewQANotes" TEXT,
	"createdAt" TIMESTAMP DEFAULT NOW(),
	"updatedAt" TIMESTAMP DEFAULT NOW(),
    CONSTRAINT vpreview_pkey PRIMARY KEY ("reviewId"),
    CONSTRAINT fk_user_id FOREIGN KEY ("reviewUserId") REFERENCES vpuser ("id"),
    CONSTRAINT fk_pool_id FOREIGN KEY ("reviewPoolId") REFERENCES vpmapped ("mappedPoolId"),
    CONSTRAINT fk_visit_id_legacy FOREIGN KEY ("reviewVisitIdLegacy") REFERENCES vpvisit ("visitIdLegacy")
);

CREATE TRIGGER trigger_updated_at BEFORE UPDATE
    ON vpreview FOR EACH ROW EXECUTE PROCEDURE 
    set_updated_at();

COPY vpreview(
    "reviewUserName",
    "reviewUserId",
    "reviewPoolId",
    "reviewVisitIdLegacy",
    "reviewVisitId",
    "reviewQACode",
    "reviewQAAlt",
    "reviewQAPerson",
    "reviewQADate",
    "reviewQANotes"
)
FROM '/home/ubuntu/VPAtlas-node-api/vpReview/db.04/vpreview.20190611.csv' DELIMITER ',' CSV HEADER;
--FROM 'vpreview.20190611.csv' DELIMITER ',' CSV HEADER;
--FROM 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\vpreview\db.04\vpreview.20190611.csv' DELIMITER ',' CSV HEADER;
