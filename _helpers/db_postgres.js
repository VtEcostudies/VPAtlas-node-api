/*
  https://node-postgres.com/
*/
const os = require("os");
const env = os.hostname()=='vpatlas.org'?'prod':'dev';
const config = require('../config.json');
const { Pool } = require('pg'); //a Postgres Connection Pool, not to be confused with a Vernal Pool
const connPool = new Pool(config.pg[env]);
const types = require('pg').types;
const moment = require('moment');

//https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise
const pgp = require('pg-promise')({
    capSQL: true // capitalize all generated SQL
});
const pgpDb = pgp(config.pg[env]);

console.log(`hostname: ${os.hostname}`);
console.log(`environment: ${env}`);
console.log(`postgres config:`);
console.dir(config.pg[env]);

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
