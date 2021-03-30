const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = [];

module.exports = {
    getColumns,
    getCount,
    getOverview,
    getAll,
    getPage,
    getById,
    getGeoJson,
    create,
    update,
    delete: _delete
};

//file scope list of vpvisit table columns retrieved on app startup (see 'getColumns()' below)
pgUtil.getColumns("vpvisit", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        return res;
    })
    .catch(err => {
        console.log(`vpVisit.service.pg.pgUtil.getColumns | table:vpvisit | error: `, err.message);
    });

pgUtil.getColumns("vpknown", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        return res;
    })
    .catch(err => {
        console.log(`vpPools.service.pg.pgUtil.getColumns | table:vpknown | error: `, err.message);
    });

pgUtil.getColumns("vptown", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        return res;
    })
    .catch(err => {
        console.log(`vpPools.service.pg.pgUtil.getColumns | table:vptown | error: `, err.message);
    });

function getColumns() {
    return new Promise((resolve, reject) => {
      console.log(`vpVisit.service.pg.getColumns | staticColumns:`, staticColumns);
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
  New primary query for map/table list view - smaller dataset to improve speed.
*/
async function getOverview(params={}) {
    var orderClause = 'order by "visitId"';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    const where = pgUtil.whereClause(params, staticColumns, 'AND');
    const text = `
SELECT
vptown."townId",
vptown."townName",
vpcounty."countyName",
vpknown."poolId",
SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpknown."poolStatus",
vpknown."sourceVisitId",
vpknown."sourceSurveyId",
vpknown."updatedAt" AS "knownUpdatedAt",
vpmapped."mappedLandownerPermission",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpvisit."visitId",
vpvisit."visitUserName",
vpvisit."visitDate",
vpvisit."visitLatitude",
vpvisit."visitLongitude",
vpvisit."visitVernalPool",
vpvisit."visitLatitude",
vpvisit."visitLongitude",
vpvisit."updatedAt" AS "visitUpdatedAt"
FROM vpknown
INNER JOIN vpmapped ON "mappedPoolId"="poolId"
INNER JOIN vpvisit ON "visitPoolId"="poolId"
LEFT JOIN vptown ON "knownTownId"="townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
WHERE "visitId" > 0
${where.text} ${orderClause};`;
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
    const where = pgUtil.whereClause(params, staticColumns, 'AND');
    const text = `
SELECT
(SELECT COUNT(*) FROM vpmapped INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId" ${where.text}) AS count,
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
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpmapped."createdAt" AS "mappedCreatedAt",
vpvisit.*,
vpvisit."updatedAt" AS "visitUpdatedAt",
vpvisit."createdAt" AS "visitCreatedAt"
from vpknown
INNER JOIN vpmapped ON vpknown."poolId"=vpmapped."mappedPoolId"
INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
LEFT JOIN vptown ON vpknown."knownTownId"=vptown."townId"
WHERE "visitId" > 0
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
    var where = pgUtil.whereClause(params, staticColumns, 'AND'); //whereClause filters output against vpvisit.columns
    const text = `
SELECT
(SELECT COUNT(*) FROM vpmapped INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId" ${where.text}) AS count,
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
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpmapped."createdAt" AS "mappedCreatedAt",
vpvisit.*,
vpvisit."updatedAt" AS "visitUpdatedAt",
vpvisit."createdAt" AS "visitCreatedAt"
from vpknown
INNER JOIN vpmapped ON vpknown."poolId"=vpmapped."mappedPoolId"
INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
LEFT JOIN vptown ON vpknown."knownTownId"=vptown."townId"
WHERE "visitId" > 0
${where.text} ${orderClause}
offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getById(id) {
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
      vpmapped."updatedAt" AS "mappedUpdatedAt",
      vpmapped."createdAt" AS "mappedCreatedAt",
      vpvisit.*,
      vpvisit."updatedAt" AS "visitUpdatedAt",
      vpvisit."createdAt" AS "visitCreatedAt"
      from vpknown
      INNER JOIN vpmapped ON vpknown."poolId"=vpmapped."mappedPoolId"
      INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
      LEFT JOIN vptown ON vpknown."knownTownId"=vptown."townId"
      WHERE "visitId"=$1;`;
    return await query(text, [id])
}

async function getGeoJson(body={}) {
    const where = pgUtil.whereClause(params, staticColumns, 'AND');
    const sql = `
    SELECT
        row_to_json(fc) as geojson
    FROM (
        SELECT
    		'FeatureCollection' AS type,
    		'Vermont Vernal Pool Atlas - Pool Visits' as name,
    		'{ "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3857" } }'::json as crs,
        array_to_json(array_agg(f)) AS features
        FROM (
            SELECT
                'Feature' AS type,
                ST_AsGeoJSON("poolLocation")::json as geometry,
                (SELECT
                  row_to_json(p) FROM (SELECT
                    vpknown.*,
                    vpvisit.*
                  ) AS p
              ) AS properties
            FROM vpknown
            INNER JOIN vpvisit on "visitPoolId"="poolId"
            WHERE "visitId" > 0
            ${where.text}
        ) AS f
    ) AS fc;`
    console.log('vpVisit.service | getGeoJson |', where.text, where.values);
    return await query(sql, where.values);
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
