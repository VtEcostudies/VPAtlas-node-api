const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = [];

module.exports = {
    getColumns,
    getCount,
    getAll,
    getPage,
    getById,
    create,
    update,
    delete: _delete
};

//file scope list of vpvisit table columns retrieved on app startup (see 'getColumns()' below)
pgUtil.getColumns("vpvisit", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        staticColumns.push(`vptown."townName"`); //Add this for town filter query
        staticColumns.push(`visittown."townName"`); //Add this for town filter query
        staticColumns.push(`mappedtown."townName"`); //Add this for town filter query
        return res;
    })
    .catch(err => {
        console.log(`vpVisit.service.pg.pgUtil.getColumns | error: `, err.message);
    });

function getColumns() {
    console.log(`vpVisit.service.pg.getColumns | staticColumns:`, staticColumns);
    return staticColumns;
}

async function getCount(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select count(*) from vpvisit ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getAll(params={}) {
    var orderClause = 'order by "visitId"';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    const where = pgUtil.whereClause(params, staticColumns);
    const text = `
        SELECT
        (SELECT COUNT(*) FROM vpmapped INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId" ${where.text}) AS count,
        to_json(mappedtown) AS "mappedTown",
        to_json(visittown) AS "visitTown",
        vpmapped.*,
        vpmapped."updatedAt" AS "mappedUpdatedAt",
        vpmapped."createdAt" AS "mappedCreatedAt",
        vpmapped."mappedPoolId" AS "poolId",
        vpmapped."mappedLatitude" AS "latitude",
        vpmapped."mappedLongitude" AS "longitude",
        vpvisit.*, 
        vpvisit."updatedAt" AS "visitUpdatedAt",
        vpvisit."createdAt" AS "visitCreatedAt"
        from vpmapped
        INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
        LEFT JOIN vptown AS mappedtown ON vpmapped."mappedTownId"=mappedtown."townId"
        LEFT JOIN vptown AS visittown ON vpvisit."visitTownId"=visittown."townId"
        ${where.text} ${orderClause};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getPage(page, params={}) {
    page = Number(page) ? Number(page) : 1;
    const pageSize = Number(params.pageSize) ? Number(params.pageSize) : 10;
    const offset = (page-1) * pageSize;
    var orderClause = 'order by "visitId"';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    var where = pgUtil.whereClause(params, staticColumns); //whereClause filters output against vpvisit.columns
    const text = `
        SELECT
        (SELECT COUNT(*) FROM vpmapped INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId" ${where.text}) AS count,
        to_json(mappedtown) AS "mappedTown",
        to_json(visittown) AS "visitTown",
        vpmapped.*,
        vpmapped."updatedAt" AS "mappedUpdatedAt",
        vpmapped."createdAt" AS "mappedCreatedAt",
        vpmapped."mappedPoolId" AS "poolId",
        vpmapped."mappedLatitude" AS "latitude",
        vpmapped."mappedLongitude" AS "longitude",
        vpvisit.*, 
        vpvisit."updatedAt" AS "visitUpdatedAt",
        vpvisit."createdAt" AS "visitCreatedAt"
        from vpmapped
        INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
        LEFT JOIN vptown AS mappedtown ON vpmapped."mappedTownId"=mappedtown."townId"
        LEFT JOIN vptown AS visittown ON vpvisit."visitTownId"=visittown."townId"
        ${where.text} ${orderClause} offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getById(id) {
    const text = `
        SELECT
        to_json(mappedtown) AS "mappedTown",
        to_json(visittown) AS "visitTown",
        vpmapped.*,
        vpmapped."updatedAt" AS "mappedUpdatedAt",
        vpmapped."createdAt" AS "mappedCreatedAt",
        vpmapped."mappedPoolId" AS "poolId",
        vpmapped."mappedLatitude" AS "latitude",
        vpmapped."mappedLongitude" AS "longitude",
        vpvisit.*, 
        vpvisit."updatedAt" AS "visitUpdatedAt",
        vpvisit."createdAt" AS "visitCreatedAt"
        from vpmapped
        INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
        LEFT JOIN vptown AS mappedtown ON vpmapped."mappedTownId"=mappedtown."townId"
        LEFT JOIN vptown AS visittown ON vpvisit."visitTownId"=visittown."townId"
        WHERE "visitId"=$1;`;
    return await query(text, [id])
}

async function create(body) {
    var queryColumns = pgUtil.parseColumns(body, 1, [], staticColumns);
    text = `insert into vpvisit (${queryColumns.named}) values (${queryColumns.numbered}) returning "visitId"`;
    console.log(text, queryColumns.values);
    var res = await query(text, queryColumns.values);
    console.log('vpVisit.service.create | returning: ', res);
    return res;
}

async function update(id, body) {
    console.log(`vpVisit.service.update | before pgUtil.parseColumns`, staticColumns);
    var queryColumns = pgUtil.parseColumns(body, 2, [id], staticColumns);
    text = `update vpvisit set (${queryColumns.named}) = (${queryColumns.numbered}) where "visitId"=$1 returning "visitId"`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function _delete(id) {
    return await query(`delete from vpvisit where "visitId"=$1;`, [id]);
}