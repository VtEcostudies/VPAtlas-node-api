/*
    Mid-Alpha development, the team decided that 'Mapped Pools' and 'Pool Visits'
    should just be one list of items having different amounts of data. This module
    serves the gets for those joined table queries.
*/
const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = [];

module.exports = {
    getColumns,
    getCount,
    getOverview,
    getPoolsNeedReview,
    getAll,
    getPage,
    getByVisitId,
    getByPoolId
};

//file scope list of vpvisit table columns retrieved on app startup (see 'getColumns()' below)
pgUtil.getColumns("vpmapped", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        return res;
    })
    .catch(err => {
        console.log(`vpPools.service.pg.pgUtil.getColumns | error: `, err.message);
    });

pgUtil.getColumns("vpvisit", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        return res;
    })
    .catch(err => {
        console.log(`vpPools.service.pg.pgUtil.getColumns | error: `, err.message);
    });

pgUtil.getColumns("vpreview", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        return res;
    })
    .catch(err => {
        console.log(`vpPools.service.pg.pgUtil.getColumns | error: `, err.message);
    });

pgUtil.getColumns("vpknown", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        return res;
    })
    .catch(err => {
        console.log(`vpPools.service.pg.pgUtil.getColumns | error: `, err.message);
    });

pgUtil.getColumns("vptown", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        return res;
    })
    .catch(err => {
        console.log(`vpPools.service.pg.pgUtil.getColumns | error: `, err.message);
    });

function getColumns() {
  return new Promise((resolve, reject) => {
    console.log(`vpPools.service.pg.getColumns | staticColumns:`, staticColumns);
    resolve(staticColumns);
  });
}

async function getCount(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select count(*) from vpvisit ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

/*
  The NEW primary map/table overview query.

  A new, minimized dataset for the primary map/table overview query.
  This uses a database VIEW, "poolsGetOverview", which complicates the
  whereClause logic...

  This still supports filtering results by "updatedAt" to reduce network
  traffic and speed the UX.
*/
async function getOverview(params={timestamp:'1970-02-28'}) {
  var orderClause = 'order by "poolId"';
  var timestamp = params.timestamp;
  delete params.timestamp;
  const where = pgUtil.whereClause(params, staticColumns, 'AND');
  var text = `SELECT * FROM "poolsGetOverview"
    WHERE
    ("updatedAt">'${timestamp}'::timestamp
    OR "mappedUpdatedAt">'${timestamp}'::timestamp
    OR "visitUpdatedAt">'${timestamp}'::timestamp
    OR "reviewUpdatedAt">'${timestamp}'::timestamp)
    ${where.text} ${orderClause}`;
  console.log(text);
  return await query(text, where.values);
}

/*
  This endpoint serves the UI filter for 'Review', which is all the pools that need
  to be Reviewed by an administrator.
*/
async function getPoolsNeedReview(params={timestamp:'1970-02-28'}) {
  var orderClause = 'order by "poolId"';
  const timestamp = params.timestamp;
  delete params.timestamp;
  const where = pgUtil.whereClause(params, staticColumns, 'AND');
  text = `
  SELECT * FROM "poolsGetOverview"
  WHERE
    ("reviewId" IS NULL AND "visitId" IS NOT NULL
    OR ("reviewUpdatedAt" IS NOT NULL AND "mappedUpdatedAt" > "reviewUpdatedAt")
    OR ("reviewUpdatedAt" IS NOT NULL AND "visitUpdatedAt" > "reviewUpdatedAt"))
  AND
    ("mappedUpdatedAt">'${timestamp}'::timestamp
    OR "visitUpdatedAt">'${timestamp}'::timestamp
    OR "reviewUpdatedAt">'${timestamp}'::timestamp)
  ${where.text}
  ${orderClause};
  `;
    console.log(text, where.values);
    return await query(text, where.values);
}

/*
  getAll serves API endpoints needing *all* fields. This no longer serves map/table
  views.
*/
async function getAll(params={}) {
    var orderClause = 'order by "mappedPoolId"';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    const where = pgUtil.whereClause(params, staticColumns);
    const text = `
SELECT
(SELECT COUNT(*) FROM vpmapped LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId" ${where.text}) AS count,
vptown.*,
vpknown."poolId",
SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpknown."poolStatus",
vpknown."sourceVisitId",
vpknown."sourceSurveyId",
vpknown."createdAt" AS "knownCreatedAt",
vpknown."updatedAt" AS "knownUpdatedAt	",
vpmapped.*,
vpmapped."createdAt" AS "mappedCreatedAt",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpvisit.*,
vpvisit."createdAt" AS "visitCreatedAt",
vpvisit."updatedAt" AS "visitUpdatedAt",
vpreview.*,
vpreview."createdAt" AS "reviewCreatedAt",
vpreview."updatedAt" AS "reviewUpdatedAt"
FROM vpknown
INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpknown."poolId"
LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpknown."poolId"
LEFT JOIN vpreview ON vpreview."reviewPoolId"=vpknown."poolId"
LEFT JOIN vptown ON vpknown."knownTownId"=vptown."townId"
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
(SELECT COUNT(*) FROM vpmapped LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId" ${where.text}) AS count,
vptown.*,
vpknown."poolId",
SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpknown."poolStatus",
vpknown."sourceVisitId",
vpknown."sourceSurveyId",
vpknown."createdAt" AS "knownCreatedAt",
vpknown."updatedAt" AS "knownUpdatedAt	",
vpmapped.*,
vpmapped."createdAt" AS "mappedCreatedAt",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpvisit.*,
vpvisit."createdAt" AS "visitCreatedAt",
vpvisit."updatedAt" AS "visitUpdatedAt",
vpreview.*,
vpreview."createdAt" AS "reviewCreatedAt",
vpreview."updatedAt" AS "reviewUpdatedAt"
FROM vpknown
INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpknown."poolId"
LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpknown."poolId"
LEFT JOIN vpreview ON vpreview."reviewPoolId"=vpknown."poolId"
LEFT JOIN vptown ON vpknown."knownTownId"=vptown."townId"
${where.text} ${orderClause}
offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getByVisitId(id) {
    const text = `
SELECT
vptown.*,
vpknown."poolId",
SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpknown."poolStatus",
vpknown."sourceVisitId",
vpknown."sourceSurveyId",
vpknown."createdAt" AS "knownCreatedAt",
vpknown."updatedAt" AS "knownUpdatedAt	",
vpmapped.*,
vpmapped."createdAt" AS "mappedCreatedAt",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpvisit.*,
vpvisit."createdAt" AS "visitCreatedAt",
vpvisit."updatedAt" AS "visitUpdatedAt",
vpreview.*,
vpreview."createdAt" AS "reviewCreatedAt",
vpreview."updatedAt" AS "reviewUpdatedAt"
FROM vpknown
INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpknown."poolId"
LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpknown."poolId"
LEFT JOIN vpreview ON vpreview."reviewPoolId"=vpknown."poolId"
LEFT JOIN vptown ON vpknown."knownTownId"=vptown."townId"
WHERE "visitId"=$1;`;
    return await query(text, [id])
}

async function getByPoolId(id) {
    const text = `
SELECT
vptown.*,
vpknown."poolId",
SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpknown."poolStatus",
vpknown."sourceVisitId",
vpknown."sourceSurveyId",
vpknown."createdAt" AS "knownCreatedAt",
vpknown."updatedAt" AS "knownUpdatedAt	",
vpmapped.*,
vpmapped."createdAt" AS "mappedCreatedAt",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpvisit.*,
vpvisit."createdAt" AS "visitCreatedAt",
vpvisit."updatedAt" AS "visitUpdatedAt",
vpreview.*,
vpreview."createdAt" AS "reviewCreatedAt",
vpreview."updatedAt" AS "reviewUpdatedAt"
FROM vpknown
INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpknown."poolId"
LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpknown."poolId"
LEFT JOIN vpreview ON vpreview."reviewPoolId"=vpknown."poolId"
LEFT JOIN vptown ON vpknown."knownTownId"=vptown."townId"
WHERE "mappedPoolId"=$1;`;
    return await query(text, [id])
}
