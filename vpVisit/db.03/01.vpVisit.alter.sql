ALTER TABLE vpvisit ALTER COLUMN "visitDate" TYPE DATE USING "visitDate"::date;
ALTER TABLE vpvisit ALTER COLUMN "visitPoolId" SET NOT NULL;