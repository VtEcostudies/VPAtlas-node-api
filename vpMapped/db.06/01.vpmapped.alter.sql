--add a column to record the actual person who mapped the pool in the field 'mappedObserverUserName'

--Initially, don't require this field. Leave it NULL for existing rows.
--After adding to table and adding appropriate values for existing data, make it required.
ALTER TABLE vpmapped ADD COLUMN "mappedObserverUserName" TEXT;
