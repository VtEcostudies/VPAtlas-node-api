const config = require('config.json');
const { Pool } = require('pg'); //a Postgres Connection Pool, not to be confused with a Vernal Pool
const connPool = new Pool(config.pg);

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