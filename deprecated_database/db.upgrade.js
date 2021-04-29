/*
 this module attempts to capture the process to create database elements, import
 initial datasets, then migrate those db elements and datasets over time.
 
 it is not foolproof. beware.
 */
const fs = require('fs'); //uses process.cwd() as root for relative paths
const path = require("path"); //needed to use paths relative to this file's location
const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = [];

module.exports = {
    importCSV,
    upgrade
};  

/*
 try to do the next upgrade here
 -query dbversion for last successful upgrade versionId
 -increment upgrade number from last successful
 -use upgrade number to try the next one
 */
async function upgrade() {
    const nextQuery = 'SELECT max("dbVersionId") AS "dbVersionId" FROM dbversion;';
    await query(nextQuery)
    .then(res => {
        var next = Number(res.rows[0].dbVersionId);
        next++;
        console.log('db.upgrade.upgrade | next upgrade Id:', next);
        try_upgrade(next)
            .then(res => {
                console.log(res);
                return res;
            })
            .catch(err => {
                console.log(err);
                return err;
            });
    })
    .catch(err => {
        console.log('db.upgrade.upgrade | err:', err);
        return err;
    });
}

async function try_upgrade(next) {
    const upgradeFile = path.resolve(__dirname, `db.upgrade_${next}.sql`);
    if (!fs.existsSync(upgradeFile)) {
        throw `Error: ${upgradeFile} does not exist.`;
    }
    const sqlUpgrade = fs.readFileSync(upgradeFile).toString();
    console.log(`db.upgrade.try_upgrade_${next} | query:`, sqlUpgrade);
    await query(sqlUpgrade)
    .then(res => {
        console.log(`db.upgrade.try_upgrade_${next} | res:`, res);
        return query (`INSERT INTO dbversion
                    ("dbVersionId","dbUpgradeFileName","dbUpgradeScript")
                    VALUES (${next},${upgradeFile},${sqlUpgrade})`);
    })
    .catch(err => {
        console.log(`db.upgrade.try_upgrade_${next} | err:`, err.message);
        throw err;
    });
}

async function importCSV(next) {
    const csvSqlFile = path.resolve(__dirname, `import_${next}.sql`);
    const csvDataFile = path.resolve(__dirname, `import_${next}.csv`);
    if (!fs.existsSync(csvSqlFile)) {
        throw `Error: ${csvSqlFile} does not exist.`;
    }
    const sqlImport = fs.readFileSync(csvSqlFile).toString();
    const qtext = `${sqlImport} FROM '${csvDataFile}' DELIMITER ',' CSV HEADER;`;
    console.log('db.upgrade.importCSV | query:', qtext);
    await query(qtext)
    .then(res => {
        console.log(`db.upgrade.importCSV() | res:`, res);
        return res;
    })
    .catch(err => {
        console.log(`db.upgrade.importCSV() | err:`, err.message);
        throw err;
    });
}
