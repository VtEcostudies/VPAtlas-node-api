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

//file scope list of vpPools tables' columns retrieved at app startup (see 'getColumns()' below)
const tables = [
  "vpmapped",
  "vpvisit",
  "vpreview",
  "vpsurvey",
  "vpsurvey_observer_species_counts",
  "vptown"
];
for (i=0; i<tables.length; i++) {
  pgUtil.getColumns(tables[i], staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {return res;})
    .catch(err => {console.log(`vpPools.service.pg.pgUtil.getColumns | table:${tables[i]} | error: `, err.message);});
}

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
  var text = `
SELECT
"townId",
"townName",
"countyName",
"mappedPoolId" AS "poolId",
"mappedPoolStatus" AS "poolStatus",
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
"mappedByUser",
"mappedMethod",
"mappedConfidence",
"mappedLocationUncertainty",
--"mappedObserverUserId",
vpmapped."updatedAt" AS "mappedUpdatedAt",
"visitId",
"visitPoolId",
"visitUserName",
"visitDate",
"visitVernalPool",
"visitLatitude",
"visitLongitude",
vpvisit."updatedAt" AS "visitUpdatedAt",
"reviewId",
"reviewQACode",
"reviewPoolStatus",
vpreview."updatedAt" AS "reviewUpdatedAt",
"surveyId",
surveyuser.username,
vpsurvey."updatedAt" AS "surveyUpdatedAt"
FROM vpmapped
LEFT JOIN vpvisit ON "visitPoolId"="mappedPoolId"
LEFT JOIN vpreview ON "reviewPoolId"="mappedPoolId"
LEFT JOIN vpsurvey ON "surveyPoolId"="mappedPoolId"
LEFT JOIN vptown ON "mappedTownId"="townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
LEFT JOIN vpuser AS surveyuser ON "surveyUserId"="id"
WHERE
(vpmapped."updatedAt">'${timestamp}'::timestamp
OR vpvisit."updatedAt">'${timestamp}'::timestamp
OR vpreview."updatedAt">'${timestamp}'::timestamp
OR vpsurvey."updatedAt">'${timestamp}'::timestamp)
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
SELECT
"townId",
"townName",
"countyName",
"mappedPoolId" AS "poolId",
"mappedPoolStatus" AS "poolStatus",
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
"mappedByUser",
"mappedMethod",
"mappedConfidence",
"mappedLocationUncertainty",
--"mappedObserverUserId",
vpmapped."updatedAt" AS "mappedUpdatedAt",
"visitId",
"visitPoolId",
"visitUserName",
"visitDate",
"visitVernalPool",
"visitLatitude",
"visitLongitude",
vpvisit."updatedAt" AS "visitUpdatedAt",
"reviewId",
"reviewQACode",
"reviewPoolStatus",
vpreview."updatedAt" AS "reviewUpdatedAt",
"surveyId",
vpsurvey."updatedAt" AS "surveyUpdatedAt"
FROM vpmapped
LEFT JOIN vpvisit ON "visitPoolId"="mappedPoolId"
LEFT JOIN vpreview ON "reviewPoolId"="mappedPoolId"
LEFT JOIN vpsurvey ON "surveyPoolId"="mappedPoolId"
LEFT JOIN vptown ON "mappedTownId"="townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
--LEFT JOIN vpuser ON "mappedByUserId"="id";
WHERE
("reviewId" IS NULL AND "visitId" IS NOT NULL
OR (vpreview."updatedAt" IS NOT NULL AND vpmapped."updatedAt" > vpreview."updatedAt")
OR (vpreview."updatedAt" IS NOT NULL AND vpvisit."updatedAt" > vpreview."updatedAt"))
AND
(vpmapped."updatedAt">'${timestamp}'::timestamp
OR vpvisit."updatedAt">'${timestamp}'::timestamp
OR vpreview."updatedAt">'${timestamp}'::timestamp
OR vpsurvey."updatedAt">'${timestamp}'::timestamp)
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
"townId",
"townName",
"countyName",
"mappedPoolId" AS "poolId",
"mappedPoolStatus" AS "poolStatus",
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpmapped.*,
vpmapped."createdAt" AS "mappedCreatedAt",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpvisit.*,
vpvisit."createdAt" AS "visitCreatedAt",
vpvisit."updatedAt" AS "visitUpdatedAt",
vpreview.*,
vpreview."createdAt" AS "reviewCreatedAt",
vpreview."updatedAt" AS "reviewUpdatedAt",
"surveyId",
vpsurvey."createdAt" AS "surveyCreatedAt",
vpsurvey."updatedAt" AS "surveyUpdatedAt"
FROM vpmapped
LEFT JOIN vpvisit ON vpvisit."visitPoolId"="mappedPoolId"
LEFT JOIN vpreview ON vpreview."reviewPoolId"="mappedPoolId"
LEFT JOIN vpsurvey ON "surveyPoolId"="mappedPoolId"
LEFT JOIN vptown ON "mappedTownId"=vptown."townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
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
"townId",
"townName",
"countyName",
"mappedPoolId" AS "poolId",
"mappedPoolStatus" AS "poolStatus",
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpmapped.*,
vpmapped."createdAt" AS "mappedCreatedAt",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpvisit.*,
vpvisit."createdAt" AS "visitCreatedAt",
vpvisit."updatedAt" AS "visitUpdatedAt",
vpreview.*,
vpreview."createdAt" AS "reviewCreatedAt",
vpreview."updatedAt" AS "reviewUpdatedAt",
"surveyId",
vpsurvey."createdAt" AS "surveyCreatedAt",
vpsurvey."updatedAt" AS "surveyUpdatedAt"
FROM vpmapped
LEFT JOIN vpvisit ON vpvisit."visitPoolId"="mappedPoolId"
LEFT JOIN vpreview ON vpreview."reviewPoolId"="mappedPoolId"
LEFT JOIN vpsurvey ON "surveyPoolId"="mappedPoolId"
LEFT JOIN vptown ON "mappedTownId"=vptown."townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
${where.text} ${orderClause}
offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getByVisitId(id) {
    const text = `
SELECT
"townId",
"townName",
"countyName",
"mappedPoolId" AS "poolId",
"mappedPoolStatus" AS "poolStatus",
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpmapped.*,
vpmapped."createdAt" AS "mappedCreatedAt",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpvisit.*,
vpvisit."createdAt" AS "visitCreatedAt",
vpvisit."updatedAt" AS "visitUpdatedAt",
vpreview.*,
vpreview."createdAt" AS "reviewCreatedAt",
vpreview."updatedAt" AS "reviewUpdatedAt"
FROM vpmapped
LEFT JOIN vpvisit ON "visitPoolId"="mappedPoolId"
LEFT JOIN vpreview ON "reviewPoolId"="mappedPoolId"
LEFT JOIN vptown ON "mappedTownId"=vptown."townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
WHERE "visitId"=$1;`;
    return await query(text, [id])
}

async function getByPoolId(id) {
    const text = `
SELECT
"townId",
"townName",
"countyName",
"mappedPoolId" AS "poolId",
"mappedPoolStatus" AS "poolStatus",
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpmapped.*,
vpmapped."createdAt" AS "mappedCreatedAt",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpvisit.*,
vpvisit."createdAt" AS "visitCreatedAt",
vpvisit."updatedAt" AS "visitUpdatedAt",
vpreview.*,
vpreview."createdAt" AS "reviewCreatedAt",
vpreview."updatedAt" AS "reviewUpdatedAt"
FROM vpmapped
LEFT JOIN vpvisit ON "visitPoolId"="mappedPoolId"
LEFT JOIN vpreview ON "reviewPoolId"="mappedPoolId"
LEFT JOIN vptown ON "mappedTownId"=vptown."townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
WHERE "mappedPoolId"=$1;`;
    return await query(text, [id])
}
