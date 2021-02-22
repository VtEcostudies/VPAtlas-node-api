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
    getGeoJson,
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
async function getStats(body={"username":null}) {
    const text = `select
(select count("mappedPoolId") from vpmapped) as total_data,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"!='Eliminated' AND "mappedPoolStatus"!='Duplicate'
) as total,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Potential') as potential,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Probable') as probable,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Confirmed') as confirmed,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Duplicate') as duplicate,
(select count("mappedPoolId") from vpmapped where "mappedPoolStatus"='Eliminated') as eliminated,
(select count("mappedPoolId") from vpmapped m
left join vpvisit v on v."visitPoolId"=m."mappedPoolId"
left join vpreview r on r."reviewVisitId"=v."visitId"
where r."reviewVisitId" is null and v."visitId" is not null
) as review,
(select count(distinct("visitPoolId")) from vpvisit inner join vpmapped on vpmapped."mappedPoolId"=vpvisit."visitPoolId"
where "mappedPoolStatus"!='Eliminated' AND "mappedPoolStatus"!='Duplicate'
) as visited,
(select count(distinct("mappedPoolId")) from vpmapped left join vpvisit on vpmapped."mappedPoolId"=vpvisit."visitPoolId"
 where "mappedByUser"='${body.username}' OR "visitUserName"='${body.username}'
) as mine,
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

async function getGeoJson(body={}) {
    console.log('vpMapped.service | getGeoJson |', body);
    //"mappedPoolStatus" IN ('Potential', 'Probable', 'Confirmed')
    const where = pgUtil.whereClause(body, staticColumns);
    const sql = `
    SELECT
    row_to_json(fc) AS geojson
    FROM (
        SELECT
    		'FeatureCollection' AS type,
    		'Vermont Vernal Pool Atlas - Mapped Pools' AS name,
            array_to_json(array_agg(f)) AS features
        FROM (
            SELECT
                'Feature' AS type,
    			ST_AsGeoJSON(ST_GeomFromText('POINT(' || "mappedLongitude" || ' ' || "mappedLatitude" || ')'))::json as geometry,
                (SELECT
    			 	--note: mappedComments, others contain characters that are illegal for geoJSON
    				row_to_json(p) FROM (
    					SELECT
    					vpmapped."mappedPoolId",
    					vpmapped."mappedByUser",
    					vpmapped."mappedByUserId",
    					vpmapped."mappedDateText",
    					--vpmapped."mappedDateUnixSeconds",
    					--vpmapped."mappedLatitude",
    					--vpmapped."mappedLongitude",
    					vpmapped."mappedConfidence",
    					vpmapped."mappedSource",
    					vpmapped."mappedSource2",
    					vpmapped."mappedPhotoNumber",
    					vpmapped."mappedLocationAccuracy",
    					vpmapped."mappedShape",
    					--vpmapped."mappedComments",
    					vpmapped."createdAt",
    					vpmapped."updatedAt",
    					--vpmapped."mappedlocationInfoDirections",
    					vpmapped."mappedLandownerPermission",
    					--vpmapped."mappedLandownerInfo",
    					vpmapped."mappedLocationUncertainty",
    					--vpmapped."mappedTownId",
    					--vpmapped."mappedPoolLocation",
    					--vpmapped."mappedPoolBorder",
    					--vpmapped."mappedLandownerName",
    					--vpmapped."mappedLandownerAddress",
    					--vpmapped."mappedLandownerTown",
    					--vpmapped."mappedLandownerStateAbbrev",
    					--vpmapped."mappedLandownerZip5",
    					--vpmapped."mappedLandownerPhone",
    					--vpmapped."mappedLandownerEmail",
    					vpmapped."mappedPoolStatus",
    					vpmapped."mappedMethod",
    					vpmapped."mappedObserverUserName"
    				) AS p
    			) AS properties
        FROM vpmapped ${where.text}
        ) AS f
    ) AS fc;`;
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
