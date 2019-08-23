--add a column to record the actual visiting person called 'visitObserverUserName'

--ALTER TABLE vpvisit ALTER COLUMN "visitBssaAdults" TYPE TEXT;
--Initially, don't require this field. Leave it NULL for existing rows.
ALTER TABLE vpvisit ADD COLUMN "visitObserverUserName" TEXT;

--add a column to vpuser called 'alias' to handle multiple free-text usernames from one user
ALTER TABLE vpuser ADD COLUMN "alias" TEXT[];

--example insert syntax
INSERT INTO vpuser ("username", "alias") VALUES ('Bill', ARRAY['William', 'Billy']);
--or
INSERT INTO vpuser ("username", "alias") VALUES ('Bill', '{"William", "Billy"}');

-- then, loop through vpmapped and vpvisit, normalizing username values to a single, common user
-- and putting aliases into this new alias field. to do this efficiently, i think we need to start
-- by creating all users in vpuser with all their aliases. 