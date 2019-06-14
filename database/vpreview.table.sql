DROP TABLE IF EXISTS vpvisit;

DROP SEQUENCE IF EXISTS vpreview_reqviewId_seq;

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
    CONSTRAINT fk_pool_id FOREIGN KEY ("reviewPoolId") REFERENCES vpapped ("mappedPoolId"),
    CONSTRAINT fk_visit_id FOREIGN KEY ("reviewVisitId") REFERENCES vpvisit ("visitId"),
);