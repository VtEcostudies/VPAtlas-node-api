const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = [];

module.exports = {
    getColumns,
    getCount,
    getStats,
    getAll,
    getPage,
    getById,
    create,
    update,
    delete: _delete
};

//file scope list of vpmapped table columns retrieved on app startup (see 'getColumns()' below)
pgUtil.getColumns("vpmapped", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        staticColumns.push(`vptown."townName"`); //Add this for town filter query
        return res;
    })
    .catch(err => {
        console.log(`vpMapped.service.pg.pgUtil.getColumns | error: `, err.message);
    });

function getColumns() {
    console.log(`vpMapped.service.pg.getColumns | staticColumns:`, staticColumns);
    return staticColumns;
}

async function getCount(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select count(*) from vpmapped ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

//TO-DO: filter out non-display pools for non-admin users
//maybe do this by having roles available here, filtering queries based on role.
async function getStats() {
    const text = `select 
(select count("mappedPoolId") from vpmapped) as total_data,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"!='Eliminated' AND "mappedPoolStatus"!='Duplicate') as total,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Potential') as potential,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Probable') as probable,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Confirmed') as confirmed,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Duplicate') as duplicate,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Eliminated') as eliminated,
(select count(distinct("visitPoolId")) from vpvisit inner join vpmapped on vpmapped."mappedPoolId"=vpvisit."visitPoolId" where "mappedPoolStatus"!='Eliminated' AND "mappedPoolStatus"!='Duplicate') as visited,
(select 0) as monitored;`;
    return await query(text);
}

async function getAll(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select vpmapped.*, 
                vpmapped."mappedLatitude" as "latitude",
                vpmapped."mappedLongitude" as "longitude",
                vpmapped."mappedPoolId" as "poolId",
                to_json(vptown) as "mappedTown"
                from vpmapped LEFT join vptown on vpmapped."mappedTownId"=vptown."townId"
                ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getPage(page, params={}) {
    page = Number(page) ? Number(page) : 1;
    const pageSize = Number(params.pageSize) ? Number(params.pageSize) : 10;
    const offset = (page-1) * pageSize;
    var orderClause = '';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    var where = pgUtil.whereClause(params, staticColumns); //whereClause filters output against vpmapped.columns
    const text = `select (select count(*) from vpmapped ${where.text}),
                vpmapped.*,
                vpmapped."mappedLatitude" as "latitude",
                vpmapped."mappedLongitude" as "longitude",
                vpmapped."mappedPoolId" as "poolId",
                to_json(vptown) as "mappedTown"
                from vpmapped LEFT join vptown on vpmapped."mappedTownId"=vptown."townId"
                ${where.text} ${orderClause} offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getById(id) {
    return await query(`select vpmapped.*,
                vpmapped."mappedLatitude" as "latitude",
                vpmapped."mappedLongitude" as "longitude",
                vpmapped."mappedPoolId" as "poolId",
                to_json(vptown) as "mappedTown"
                from vpmapped LEFT join vptown on vpmapped."mappedTownId"=vptown."townId"
                where "mappedPoolId"=$1;`, [id])
}

async function create(body) {
    var queryColumns = pgUtil.parseColumns(body, 1, [], staticColumns);
    text = `insert into vpmapped (${queryColumns.named}) values (${queryColumns.numbered}) returning "mappedPoolId"`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function update(id, body) {
    console.log(`vpMapped.service.update | before pgUtil.parseColumns`, staticColumns);
    var queryColumns = pgUtil.parseColumns(body, 2, [id], staticColumns);
    text = `update vpmapped set (${queryColumns.named}) = (${queryColumns.numbered}) where "mappedPoolId"=$1 returning "mappedPoolId"`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function _delete(id) {
    return await query(`delete from vpmapped where "mappedPoolId"=$1;`, [id]);
}