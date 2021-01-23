COPY (
SELECT concat('vpmapped."', column_name,'",') AS vpmapped_column_names
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'vpmapped'
)
TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_vpmapped_columns.txt' with NULL '';

COPY (
SELECT concat('vpvisit."', column_name,'",') AS vpvisit_column_names
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'vpvisit'
)
TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_vpvisit_columns.txt' with NULL '';

COPY (
SELECT concat('vpreview."', column_name,'",') AS vpreview_column_names
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'vpreview'
)
TO 'C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-node-api\database\export\vpatlas_vpreview_columns.txt' with NULL '';
