CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_updated_at BEFORE UPDATE
    ON vpmapped FOR EACH ROW EXECUTE PROCEDURE 
    set_updated_at();

/*
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
DECLARE
	column_name text := quote_ident(TG_ARGV[0]);
BEGIN
   --NEW.TG_ARGV[0] = now();
   NEW := NEW #= hstore(column_name, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_updated_at_column BEFORE UPDATE
    ON vpmapped FOR EACH ROW EXECUTE PROCEDURE 
    set_updated_at_column('updatedAt');
*/