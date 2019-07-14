ALTER TABLE vpvisit ALTER COLUMN "visitDate" TYPE DATE USING "visitDate"::date;
ALTER TABLE vpvisit ALTER COLUMN "visitPoolId" SET NOT NULL;
ALTER TABLE vpvisit RENAME "visitTown" TO "visitTownName";
ALTER TABLE vpvisit ADD COLUMN "visitLocationUncertainty" TEXT;
ALTER TABLE vpvisit RENAME COLUMN "visitCoordsource" TO "visitCoordSource";
--update visits and set visitTownId from visitTownName
--NOTE: we mangled several visitTownNames by setting a json object from the UI for several of these. may need to restore data.
UPDATE vpvisit SET "visitTownId"=(SELECT "townId" FROM vptown WHERE UPPER(vptown."townName")=UPPER(vpvisit."visitTownName"));