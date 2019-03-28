const db = require('_helpers/db_postgres');
const query = db.query;

module.exports = {
    createTable,
    importData
};

const vpMappedTable = {
    mappedPoolId: { type: String, unique: true, required: true },
    poolUser: { type: String, required: true },
    lat: { type: String, required: true },
    lon: { type: String, required: true },
    createdDate: { type: Date, default: Date.now }
};

async function createTable() {
    
}