const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = [];

module.exports = {
    getColumns,
    getCount,
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

//file scope list of vpreview table columns retrieved on app startup (see 'getColumns()' below)
pgUtil.getColumns("vpreview", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        staticColumns.push(`vptown."townName"`); //Add this for town filter query
        staticColumns.push(`visittown."townName"`); //Add this for town filter query
        staticColumns.push(`mappedtown."townName"`); //Add this for town filter query
        return res;
    })
    .catch(err => {
        console.log(`vpReview.service.pg.pgUtil.getColumns | error: `, err.message);
    });

function getColumns() {
    console.log(`vpReview.service.pg.getColumns | staticColumns:`, staticColumns);
    return staticColumns;
}

async function getCount(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select count(*) from vpreview ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

/*
NOTE:
*/
async function getAll(params={}) {
    var orderClause = 'order by "reviewId"';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    const where = pgUtil.whereClause(params, staticColumns);
    const text = `
        SELECT
        (SELECT COUNT(*) FROM vpreview INNER JOIN vpvisit ON vpvisit."visitId"=vpreview."reviewVisitId" ${where.text}) AS count,
        to_json(mappedtown) AS "mappedTown",
        to_json(visittown) AS "visitTown",
        vpreview.*,
        vpreview."updatedAt" AS "reviewUpdatedAt",
        vpreview."createdAt" AS "reviewCreatedAt",
        vpvisit.*,
        vpvisit."updatedAt" AS "visitUpdatedAt",
        vpvisit."createdAt" AS "visitCreatedAt",
        vpmapped.*,
        vpmapped."updatedAt" AS "mappedUpdatedAt",
        vpmapped."createdAt" AS "mappedCreatedAt"
        FROM vpreview
        INNER JOIN vpvisit ON vpvisit."visitId"=vpreview."reviewVisitId"
        INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpreview."reviewPoolId"
        LEFT JOIN vptown AS mappedtown ON vpmapped."mappedTownId"=mappedtown."townId"
        LEFT JOIN vptown AS visittown ON vpvisit."visitTownId"=visittown."townId"
        ${where.text} ${orderClause};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getById(id) {
    const text = `
        SELECT
        to_json(mappedtown) AS "mappedTown",
        to_json(visittown) AS "visitTown",
        vpreview.*,
        vpreview."updatedAt" AS "reviewUpdatedAt",
        vpreview."createdAt" AS "reviewCreatedAt",
        vpvisit.*,
        vpvisit."updatedAt" AS "visitUpdatedAt",
        vpvisit."createdAt" AS "visitCreatedAt",
        vpmapped.*,
        vpmapped."updatedAt" AS "mappedUpdatedAt",
        vpmapped."createdAt" AS "mappedCreatedAt"
        FROM vpreview
        INNER JOIN vpvisit ON vpvisit."visitId"=vpreview."reviewVisitId"
        INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpreview."reviewPoolId"
        LEFT JOIN vptown AS mappedtown ON vpmapped."mappedTownId"=mappedtown."townId"
        LEFT JOIN vptown AS visittown ON vpvisit."visitTownId"=visittown."townId"
        WHERE "reviewId"=$1;`;
    return await query(text, [id])
}

async function create(body) {
    var queryColumns = pgUtil.parseColumns(body, 1, [], staticColumns);
    text = `insert into vpreview (${queryColumns.named}) values (${queryColumns.numbered}) returning "reviewId"`;
    console.log(text, queryColumns.values);
    return new Promise(async (resolve, reject) => {
      await query(text, queryColumns.values)
        .then(async rev => {
          var qry = `update vpmapped set "mappedPoolStatus"=$1 where "mappedPoolId"=$2 returning $3::int as "reviewId"`;
          var val = [body.reviewPoolStatus, body.reviewPoolId, rev.rows[0].reviewId];
          console.log('vpReview.service::create', qry, val);
          await query(qry, val)
            .then(res => {resolve(res);})
            .catch(err => {reject(err);});
        })
        .catch(err => {reject(err);});
    })
}

async function update(id, body) {
    console.log(`vpReview.service.update | before pgUtil.parseColumns`, staticColumns);
    var queryColumns = pgUtil.parseColumns(body, 2, [id], staticColumns);
    text = `update vpreview set (${queryColumns.named}) = (${queryColumns.numbered}) where "reviewId"=$1 returning "reviewId"`;
    console.log(text, queryColumns.values);
    return new Promise(async (resolve, reject) => {
      await query(text, queryColumns.values)
        .then(async rev => {
          var qry = `update vpmapped set "mappedPoolStatus"=$1 where "mappedPoolId"=$2 returning $3::int as "reviewId"`;
          var val = [body.reviewPoolStatus, body.reviewPoolId, rev.rows[0].reviewId];
          console.log('vpReview.service::update', qry, val);
          await query(qry, val)
            .then(res => {resolve(res);})
            .catch(err => {reject(err);});
        })
        .catch(err => {reject(err);});
    })
}

async function _delete(id) {
    return await query(`delete from vpreview where "reviewId"=$1;`, [id]);
}
