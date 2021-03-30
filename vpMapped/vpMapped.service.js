const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = [];

module.exports = {
    getColumns,
    getCount,
    getStats,
    getOverview,
    getAll,
    getPage,
    getById,
    getGeoJson,
    create,
    update,
    delete: _delete
};

//file scope list of vpmapped table columns retrieved on app startup (see 'getColumns()' below)
pgUtil.getColumns("vpmapped", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        return res;
    })
    .catch(err => {
        console.log(`vpMapped.service.pg.pgUtil.getColumns | table:vpmapped | error: `, err.message);
    });

pgUtil.getColumns("vpknown", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        return res;
    })
    .catch(err => {
        console.log(`vpMapped.service.pg.pgUtil.getColumns | table:vpknown | error: `, err.message);
    });

pgUtil.getColumns("vptown", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        staticColumns.push(`vptown."townName"`); //Add this for town filter query
        staticColumns.push(`visittown."townName"`); //Add this for town filter query
        staticColumns.push(`mappedtown."townName"`); //Add this for town filter query
        staticColumns.push(`knowntown."townName"`); //Add this for town filter query
        staticColumns.push(`surveytown."townName"`); //Add this for town filter query
        return res;
    })
    .catch(err => {
        console.log(`vpMapped.service.pg.pgUtil.getColumns | table:vptown | error: `, err.message);
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
async function getStats(body={"username":null}) {
    if ('null' == body.username || !body.username) {body.username='unknownnobodyperson';}
    console.log('getStats | body.username=', body.username);
    const text = `
      SET body.username = ${body.username};
      SELECT * from pool_stats;
      `;
    //return await query(text); //this can't work with a multi-command statement. results are returned per-command.
    var res = await query(text);
    console.log(res[1].rows);
    return {"rowCount":res[1].rowCount, "rows":res[1].rows};
}

async function getOverview(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `
      SELECT * FROM "mappedGetOverview"
      ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getAll(body={}) {
    console.log('vpmapped.service::getAll | ', staticColumns);
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `
      SELECT * FROM "mappedGetOverview"
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
    const text = `
      SELECT (SELECT count(*) from vpmapped ${where.text}),
      * FROM "mappedGetOverview"
      ${where.text} ${orderClause}
      offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getById(id) {
    const text = `
    SELECT
    vptown.*,
    to_json(vptown) as "mappedTown",
    vpknown."poolId",
    SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
    SPLIT_PART(ST_AsLatLonText("poolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
    vpknown."poolStatus",
    vpknown."sourceVisitId",
    vpknown."sourceSurveyId",
    vpknown."updatedAt" AS "knownUpdatedAt",
    vpmapped.*
    FROM vpknown INNER JOIN vpmapped ON "mappedPoolId"="poolId"
    LEFT JOIN vptown on "knownTownId"="townId"
    WHERE "mappedPoolId"=$1;`
    return await query(text, [id])
}

async function getGeoJson(body={}) {
    console.log('vpMapped.service | getGeoJson |', body);
    const where = pgUtil.whereClause(body, staticColumns);
    const sql = `
    SELECT
      row_to_json(fc)
      FROM (
        SELECT
    		'FeatureCollection' AS type,
    		'Vermont Vernal Pool Atlas - Mapped Pools' AS name,
    		'{ "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3857" } }'::json as crs,
        array_to_json(array_agg(f)) AS features
        FROM (
            SELECT
              'Feature' AS type,
              ST_AsGeoJSON("poolLocation")::json as geometry,
              (SELECT row_to_json(p) FROM
                (SELECT
                  vpknown."poolId",
                  vpknown."poolLocation",
                  to_json(vptown) AS "knownTown",
                  vpknown."sourceVisitId",
                  vpknown."sourceSurveyId",
                  vpknown."updatedAt" AS "knownUpdatedAt",
                  "mappedPoolId",
                  "mappedMethod",
                  "mappedLongitude", --superceded by GEOMETRY(POINT) above. included for historical reference.
                  "mappedLatitude", --superceded by GEOMETRY(POINT) above. included for historical reference.
                  "mappedObserverUserName",
                  "mappedByUser",
                  "mappedByUserId",
                  "mappedDateText",
                  "mappedMethod",
                  "mappedConfidence",
                  "mappedSource",
                  "mappedSource2",
                  "mappedPhotoNumber",
                  "mappedLocationAccuracy",
                  "mappedShape",
                  "mappedComments",
                  "mappedlocationInfoDirections",
                  "mappedLocationUncertainty",
                  "mappedTownId",
                  vpmapped."createdAt" as "mappedCreatedAt",
                  vpmapped."updatedAt" as "mappedUpdatedAt",
                  "mappedLandownerPermission"
                ) AS p
              ) AS properties
            FROM vpknown
            INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpknown."poolId"
            INNER JOIN vptown on vpknown."knownTownId"=vptown."townId"
            ${where.text}
        ) AS f
      ) AS fc`;
    console.log('vpMapped.service | getGeoJson |', where.text, where.values);
    return await query(sql, where.values);
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
