# copy config.json from another location and create it in the API root directory
# consider changing how this is done:
# - remove secrets from config.json to secrets
# - make config.json into config.js
# - pull secrets into config.js
# - add config.js to git repo
# - add config_s123.json to config.js
# - config.json is currently required in:
# - - _helpers\db_postgres.js
# - - users\sendmail.js
# - - users\vpUser.service.pg.js