/*
 NOTE: This is not implemented yet!
 */
const fs = require('fs'); //uses process.cwd() as root for relative paths
const path = require("path"); //needed to use paths relative to this file's location
const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
const sqlVpMappedTypes = fs.readFileSync(path.resolve(__dirname, 'vpMapped.types.sql').toString('utf8'));
const sqlVpMappedTable = fs.readFileSync(path.resolve(__dirname, 'vpMapped.table.sql')).toString('utf8');
const sqlVpMappedImportCsv = fs.readFileSync(path.resolve(__dirname, 'vpMapped.import.sql')).toString('utf8');
var staticColumns = [];

module.exports = {
    initVpMapped,
    createVpMappedTypes,
    createVpMappedTable,
    importCSV
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

async function createVpMappedTypes() {
    await query(sqlVpMappedTypes)
    .then(res => {
        console.log(`createVpMappedTypes() | res:`, res);
        return res;
    })
    .catch(err => {
        console.log(`createVpMappedTypes() | err:`, err.message);
        throw err;
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
