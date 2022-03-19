/*
  https://node-postgres.com/
*/
const os = require("os");
const os_env = os.hostname()=='vpatlas.org'?'prod':(os.hostname()=='dev.vpatlas.org'?'dev-remote':'dev-local');
const process = require('process');
const env = process.env;
const api_env = env.NODE_ENV?env.NODE_ENV:'dev-local';
const config = require('../config.json');

if (!config.pg[api_env]) {
  console.log('db_postgres startup ERROR |', api_env, 'is NOT a valid config key.');
  console.log('valid keys:'); Object.keys(config.pg).forEach(key => console.log(key));
  throw (`db_postgres startup ERROR | '${api_env}' is NOT a valid config key.`)
}

const moment = require('moment');
const types = require('pg').types;
const { Pool } = require('pg'); //a Postgres Connection Pool, not to be confused with a Vernal Pool
const connPool = new Pool(config.pg[api_env]);

//https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise
const pgp = require('pg-promise')({
    capSQL: true // capitalize all generated SQL
});
const pgpDb = pgp(config.pg[api_env]);

console.log(`os_hostname |`, os.hostname());
console.log(`os_env |`, os_env);
console.log(`api_env |`, api_env);
console.log(`postgres config.${api_env} |`, config.pg[api_env]);

/*
 * Fix date display error.
 * Simply by adding a function to return the raw value, we
 * override the pg_postgres default behavior, which mucks
 * date-only values by ‘correcting’ for local TZ. This is
 * confusing, because pg_postgres lives on the server, whose
 * TZ is UTC. It may be that moment(), running on the client
 * cannot properly process dates that contain an explicit
 * UTC TZ indicator with time set to 00:00, causing a correction
 * for TZ EST by subtracting 5 hours from midnight. In theory,
 * this would set the UI time back to the previous evening at 7P.
 *
 * pg_types uses postgres OIDs to identify db data types:
 *
 * date OID=1082
 * timestamp OID=1114
 *
*/
parseDate = function(val) {
   //console.log('db_postgres.parseDate', val); //NOTE: this log is hit 2x per row. HUGE API performance hit.
   //return moment(val).format('YYYY-MM-DD@HH:MM:SS'); //NOTE: this doesn't fix all dates...
   return val;
}

types.setTypeParser(1082, parseDate);

/*
NOTES:
*/
module.exports = {
  query: (text, params) => connPool.query(text, params),
  pgp: pgp,
  pgpDb: pgpDb
};
