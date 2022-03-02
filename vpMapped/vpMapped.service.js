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
const tables = [
  "vpmapped",
  "vptown"
];
for (i=0; i<tables.length; i++) {
  pgUtil.getColumns(tables[i], staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {return res;})
    .catch(err => {console.log(`vpMapped.service.pg.pgUtil.getColumns | table:${tables[i]} | error: `, err.message);});
}

function getColumns() {
    return new Promise((resolve, reject) => {
      console.log(`vpMapped.service.pg.getColumns | staticColumns:`, staticColumns);
      resolve(staticColumns);
    });
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
select
(select count("mappedPoolId") from vpmapped) as total_data,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"!='Eliminated' AND "mappedPoolStatus"!='Duplicate'
) as total,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Potential') as potential,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Probable') as probable,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Confirmed') as confirmed,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Duplicate') as duplicate,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Eliminated') as eliminated,
(select count(distinct "mappedPoolId") from vpmapped m
left join vpvisit v on v."visitPoolId"=m."mappedPoolId"
left join vpreview r on r."reviewVisitId"=v."visitId"
where
("reviewId" IS NULL AND "visitId" IS NOT NULL
OR (r."updatedAt" IS NOT NULL AND m."updatedAt" > r."updatedAt")
OR (r."updatedAt" IS NOT NULL AND v."updatedAt" > r."updatedAt"))
) as review,
(select count(distinct("visitPoolId")) from vpvisit
inner join vpmapped on vpmapped."mappedPoolId"=vpvisit."visitPoolId"
where "mappedPoolStatus"!='Eliminated' AND "mappedPoolStatus"!='Duplicate'
) as visited,
(select count(distinct("surveyPoolId")) from vpsurvey
inner join vpmapped on "mappedPoolId"="surveyPoolId"
) as monitored,
(select count(distinct("mappedPoolId")) from vpmapped
left join vpvisit on "mappedPoolId"="visitPoolId"
where "mappedByUser"='${body.username}'
OR "visitUserName"='${body.username}'
) as mine;`;
    return await query(text); //this can't work with a multi-command statement. results are returned per-command.

    /*
      Here's how it must be done if using the view 'pool_stats'. instead of in-lining values as above to this:
      where "mappedByUser"=current_setting('body.username')
      OR "visitUserName"=current_setting('body.username')
    */
    /*
    const text = `SET body.username = ${body.username}; SELECT * from pool_stats;`;
    var res = await query(text);
    console.log(res[1].rows);
    return {"rowCount":res[1].rowCount, "rows":res[1].rows};
    */
}

async function getOverview(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `
SELECT
"townId",
"townName",
"countyName",
"mappedPoolId" AS "poolId",
"mappedPoolStatus" AS "poolStatus",
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
"mappedPoolId",
"mappedPoolStatus",
"mappedByUser",
"mappedMethod",
"mappedConfidence",
"mappedObserverUserName",
"mappedLandownerPermission",
"createdAt",
"updatedAt"
FROM vpmapped
LEFT JOIN vptown ON "mappedTownId"="townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getAll(body={}) {
    console.log('vpmapped.service::getAll | ', staticColumns);
    const where = pgUtil.whereClause(body, staticColumns);
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
"createdAt" AS "mappedCreatedAt",
"updatedAt" AS "mappedUpdatedAt"
FROM vpmapped
LEFT JOIN vptown ON "mappedTownId"="townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
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
"townId",
"townName",
"countyName",
"mappedPoolId" AS "poolId",
"mappedPoolStatus" AS "poolStatus",
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpmapped.*,
"createdAt" AS "mappedCreatedAt",
"updatedAt" AS "mappedUpdatedAt"
FROM vpmapped
LEFT JOIN vptown ON "mappedTownId"="townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
${where.text} ${orderClause}
offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getById(id) {
    const text = `
SELECT
"townId",
"townName",
"countyName",
"mappedPoolId" AS "poolId",
"mappedPoolStatus" AS "poolStatus",
"createdAt" AS "mappedCreatedAt",
"updatedAt" AS "mappedUpdatedAt",
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
vpmapped.*
FROM vpmapped
LEFT JOIN vptown ON "mappedTownId"="townId"
LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
WHERE "mappedPoolId"=$1;`
    return await query(text, [id]);
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
              ST_AsGeoJSON("mappedPoolLocation")::json as geometry,
              (SELECT row_to_json(p) FROM
                (SELECT
                  "mappedPoolId" AS "poolId",
                  "mappedPoolStatus" AS "poolStatus",
                  vpmapped.*
                ) AS p
              ) AS properties
            FROM vpmapped
            INNER JOIN vptown on "mappedTownId"=vptown."townId"
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
