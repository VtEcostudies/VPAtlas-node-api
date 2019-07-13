ALTER TABLE vpvisit ALTER COLUMN "visitDate" TYPE DATE USING "visitDate"::date;
ALTER TABLE vpvisit ALTER COLUMN "visitPoolId" SET NOT NULL;
ALTER TABLE vpvisit RENAME "visitTown" TO "visitTownName";
ALTER TABLE vpvisit ADD COLUMN "visitLocationUncertainty" TEXT;
ALTER TABLE vpvisit RENAME COLUMN "visitCoordsource" TO "visitCoordSource";