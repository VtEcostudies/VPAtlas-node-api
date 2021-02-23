const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = [];

module.exports = {
    getColumns,
    getCount,
    getAll,
    getById,
    getGeoJson,
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

async function getAll(params={}) {
    var orderClause = 'order by "reviewId" desc';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    const where = pgUtil.whereClause(params, staticColumns);
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

async function getGeoJson(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const sql = `
      SELECT
          row_to_json(fc) AS geojson
      FROM (
          SELECT
      		'FeatureCollection' AS type,
      		'Vermont Vernal Pool Atlas - Pool Reviews' AS name,
              array_to_json(array_agg(f)) AS features
          FROM (
              SELECT
                  'Feature' AS type,
      			ST_AsGeoJSON(ST_GeomFromText('POINT(' || v."visitLongitude" || ' ' || v."visitLatitude" || ')'))::json as geometry,
                  (SELECT
      			 	--note: comments/notes contain characters that are illegal for geoJSON
      				row_to_json(p) FROM (SELECT
      					vpreview."reviewId",
      					vpreview."reviewUserName",
      					vpreview."reviewUserId",
      					vpreview."reviewPoolId",
      					vpreview."reviewVisitIdLegacy",
      					vpreview."reviewVisitId",
      					vpreview."reviewQACode",
      					vpreview."reviewQAAlt",
      					vpreview."reviewQAPerson",
      					vpreview."reviewQADate",
      					--vpreview."reviewQANotes",
      					vpreview."createdAt",
      					vpreview."updatedAt",
      					vpreview."reviewPoolStatus"
      				) AS p
      			) AS properties
              FROM vpreview
      		INNER JOIN vpvisit v on "reviewPoolId"="visitPoolId"
          ) AS f
      ) AS fc; `;
    console.log('vpReview.service | getGeoJson |', where.text, where.values);
    return await query(sql, where.values);
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
