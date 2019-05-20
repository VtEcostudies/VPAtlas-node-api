const config = require('config.json');

const { Pool } = require('pg'); //a Postgres Connection Pool, not to be confused with a Vernal Pool

const connPool = new Pool(config.pg);

/*
NOTES:

 */
module.exports = {
  query: (text, params) => connPool.query(text, params),
}
