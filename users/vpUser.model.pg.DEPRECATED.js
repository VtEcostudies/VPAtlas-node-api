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
const sqlVpUserTable = fs.readFileSync(path.resolve(__dirname, 'vpUser.table.sql')).toString();
const sqlVpUserImportCsv = fs.readFileSync(path.resolve(__dirname, 'vpUser.import.sql')).toString();
const sqlUpgrade01 = fs.readFileSync(path.resolve(__dirname, 'vpUser.upgrade01.sql')).toString();
var staticColumns = [];

module.exports = {
    initVpUser,
    createVpUserTable,
    importCSV,
    upgradeVpUser
};  

async function initVpUser() {
    createVpUserTable()
        .then(res => {
            pgUtil.getColumns("vpuser", staticColumns);
            importCSV()
                .then(res => {return res;})
                .catch(err => {return err;});
        })
        .catch(err => {
            return err;
        });
}

//chain future upgrades together here
async function upgradeVpUser() {
    upgrade01()
        .then(res => {
            return res;
        })
        .catch(err => {
            return err;
        });
}

async function createVpUserTable() {
    console.log('vpUser.model.createVpUserTable | query:', sqlVpUserTable);
    await query(sqlVpUserTable)
    .then(res => {
        console.log(`createVpUserTable() | res:`, res);
        return res;
    })
    .catch(err => {
        console.log(`createVpUserTable() | err:`, err.message);
        throw err;
    });
}

async function importCSV(csvFileName='vpuser.20190520.csv') {
    const qtext = `${sqlVpUserImportCsv} FROM '${path.resolve(__dirname, csvFileName)}' DELIMITER ',' CSV HEADER;`;
    console.log('vpUser.model.importCSV | query:', qtext);
    await query(qtext)
    .then(res => {
        console.log(`vpUser.service.importCSV() | res:`, res);
        return res;
    })
    .catch(err => {
        console.log(`vpUser.service.importCSV() | err:`, err.message);
        throw err;
    });
}

async function upgrade01() {
    console.log('vpUser.model.upgrade01 | query:', sqlUpgrade01);
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
