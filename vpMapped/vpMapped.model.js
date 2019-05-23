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
const sqlVpMappedTable = fs.readFileSync(path.resolve(__dirname, 'vpMapped.table.sql')).toString();
const sqlVpMappedImportCsv = fs.readFileSync(path.resolve(__dirname, 'vpMapped.import.sql')).toString();
const sqlUpgrade01 = fs.readFileSync(path.resolve(__dirname, 'vpMapped.upgrade01.sql')).toString();
var staticColumns = [];

module.exports = {
    initVpMapped,
    createVpMappedTable,
    importCSV,
    upgradeVpMapped
};  

async function initVpMapped() {
    createVpMappedTable()
        .then(res => {
            pgUtil.getColumns("vpmapped", staticColumns);
            importCSV()
                .then(res => {return res;})
                .catch(err => {return err;});
        })
        .catch(err => {
            return err;
        });
}

//chain future upgrades together here
async function upgradeVpMapped() {
    upgrade01()
        .then(res => {
            return res;
        })
        .catch(err => {
            return err;
        });
}

async function createVpMappedTable() {
    console.log('vpMapped.model.createVpMappedTable | query:', sqlVpMappedTable);
    await query(sqlVpMappedTable)
    .then(res => {
        console.log(`createVpMappedTable() | res:`, res);
        return res;
    })
    .catch(err => {
        console.log(`createVpMappedTable() | err:`, err.message);
        throw err;
    });
}

async function importCSV(csvFileName='vpmapped.20190520.csv') {
    const qtext = `${sqlVpMappedImportCsv} FROM '${path.resolve(__dirname, csvFileName)}' DELIMITER ',' CSV HEADER;`;
    console.log('vpMapped.model.importCSV | query:', qtext);
    await query(qtext)
    .then(res => {
        console.log(`vpMapped.service.importCSV() | res:`, res);
        return res;
    })
    .catch(err => {
        console.log(`vpMapped.service.importCSV() | err:`, err.message);
        throw err;
    });
}

async function upgrade01() {
    console.log('vpMapped.model.upgrade01 | query:', sqlUpgrade01);
    await query(sqlUpgrade01)
    .then(res => {
        console.log(`upgrade01() | res:`, res);
        return res;
    })
    .catch(err => {
        console.log(`upgrade01() | err:`, err.message);
        throw err;
    });
}
