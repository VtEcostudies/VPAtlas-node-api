--for adults, it's not clear whether the final data type will be number or text. tbd.
--so: leave it as int. however, we do not need to create a default value of 0.

--ALTER TABLE vpvisit ALTER COLUMN "visitWoodFrogAdults" TYPE TEXT;
ALTER TABLE vpvisit ALTER COLUMN "visitWoodFrogAdults" DROP DEFAULT;

--ALTER TABLE vpvisit ALTER COLUMN "visitSpsAdults" TYPE TEXT;
ALTER TABLE vpvisit ALTER COLUMN "visitSpsAdults" DROP DEFAULT;

--ALTER TABLE vpvisit ALTER COLUMN "visitJesaAdults" TYPE TEXT;
ALTER TABLE vpvisit ALTER COLUMN "visitJesaAdults" DROP DEFAULT;

--ALTER TABLE vpvisit ALTER COLUMN "visitBssaAdults" TYPE TEXT;
ALTER TABLE vpvisit ALTER COLUMN "visitBssaAdults" DROP DEFAULT;