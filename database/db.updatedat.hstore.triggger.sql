/*
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
DECLARE
	column_name text := quote_ident(TG_ARGV[0]);
BEGIN
   --NEW.TG_ARGV[0] = now(); --does not work
   NEW := NEW #= hstore(column_name, now()); --does not work - hstore can't handle type date
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_updated_at_column BEFORE UPDATE
    ON vpmapped FOR EACH ROW EXECUTE PROCEDURE 
    set_updated_at_column('updatedAt');
*/