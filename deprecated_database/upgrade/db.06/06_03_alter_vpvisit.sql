--add a column to record the actual visiting person called 'visitObserverUserName'

--Initially, don't require this field. Leave it NULL for existing rows.
--After adding to table and adding appropriate values for existing data, make it required.
ALTER TABLE vpvisit ADD COLUMN "visitObserverUserName" TEXT;
