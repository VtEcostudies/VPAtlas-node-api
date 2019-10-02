const config = require('config.json');
const { Pool } = require('pg'); //a Postgres Connection Pool, not to be confused with a Vernal Pool
const connPool = new Pool(config.pg);
var types = require('pg').types
//type date OID=1082
//type timestamp OID=1114

/*
simply by adding a function to return the raw value, we
override the pg_postgres default behavior, which  mucks
date-only  values by ‘correcting’ for local TZ.
*/
parseDate = function(val) {
   console.log('db_postgres.parseDate', val);
   return val;
}

types.setTypeParser(1082, parseDate);

/*
NOTES:

 */
module.exports = {
  
  query: (text, params) => connPool.query(text, params)
  
};

/*
module.exports = function() {
  const connPool = new Pool(config.pg.dev);
  
  var module = {};
  
  module.query = function(text, params) {
    connPool.query(text, params);
  };

  return module;
};

module.exports = function() {
  const connPool = new Pool(config.pg.dev);

  return {query: (text, params) => connPool.query(text, params)};
};
*/