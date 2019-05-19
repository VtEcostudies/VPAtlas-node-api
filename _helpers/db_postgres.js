const config = require('config.json');

const { Pool } = require('pg'); //a Postgres Connection Pool, not to be confused with a Vernal Pool

const connPool = new Pool(config.pg);

/*
const connPool = new Pool({
  user: 'vpatlas',
  host: 'vpatlas-dbinst.caj7x0vzcitw.us-west-2.rds.amazonaws.com',
  database: 'vpatlas',
  password: 'EatArugula',
  port: 5432,
});
*/

/*
NOTES:

 */
module.exports = {
  query: (text, params) => connPool.query(text, params),
}
