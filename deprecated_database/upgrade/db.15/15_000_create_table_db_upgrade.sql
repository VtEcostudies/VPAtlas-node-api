DROP TABLE IF EXISTS db_upgrade;

CREATE TABLE IF NOT EXISTS db_upgrade (
  db_version INTEGER UNIQUE
);

INSERT INTO db_upgrade (db_version) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14);

select * from db_upgrade;

select max(db_version) from db_upgrade;
