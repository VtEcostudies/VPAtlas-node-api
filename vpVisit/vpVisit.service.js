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
    getGeoJson,
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
    return new Promise((resolve, reject) => ({
      resolve(staticColumns);
    })
}

async function getCount(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select count(*) from vpvisit ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

/*
NOTE: in vpvist, vpivisit lat/lon are canonical
*/
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
        vpvisit.*,
        vpvisit."updatedAt" AS "visitUpdatedAt",
        vpvisit."createdAt" AS "visitCreatedAt",
        vpvisit."visitPoolId" AS "poolId",
        vpvisit."visitLatitude" AS "latitude",
        vpvisit."visitLongitude" AS "longitude"
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
        vpvisit.*,
        vpvisit."updatedAt" AS "visitUpdatedAt",
        vpvisit."createdAt" AS "visitCreatedAt",
        vpvisit."visitPoolId" AS "poolId",
        vpvisit."visitLatitude" AS "latitude",
        vpvisit."visitLongitude" AS "longitude"
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
        vpvisit.*,
        vpvisit."updatedAt" AS "visitUpdatedAt",
        vpvisit."createdAt" AS "visitCreatedAt",
        vpvisit."visitPoolId" AS "poolId",
        vpvisit."visitLatitude" AS "latitude",
        vpvisit."visitLongitude" AS "longitude"
        from vpmapped
        INNER JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
        LEFT JOIN vptown AS mappedtown ON vpmapped."mappedTownId"=mappedtown."townId"
        LEFT JOIN vptown AS visittown ON vpvisit."visitTownId"=visittown."townId"
        WHERE "visitId"=$1;`;
    return await query(text, [id])
}

async function getGeoJson(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const sql = `
    SELECT
        row_to_json(fc) as geojson
    FROM (
        SELECT
    		'FeatureCollection' AS type,
    		'Vermont Vernal Pool Atlas - Pool Visits' as name,
    		--"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
            array_to_json(array_agg(f)) AS features
        FROM (
            SELECT
                'Feature' AS type,
    			ST_AsGeoJSON(ST_GeomFromText('POINT(' || "visitLongitude" || ' ' || "visitLatitude" || ')'))::json as geometry,
                (SELECT
    			 	--note: comments fields can contain characters that are illegal for geoJSON
    				row_to_json(p) FROM (SELECT
    					vpvisit."visitId",
    					--vpvisit."visitIdLegacy",
    					vpvisit."visitUserName",
    					vpvisit."visitPoolId",
    					vpvisit."visitNavMethod",
    					vpvisit."visitCertainty",
    					vpvisit."visitLocatePool",
    					vpvisit."visitDate",
    					--vpvisit."visitTownName", --BAD values
    					--vpvisit."visitLocationComments", --BAD values
    					--vpvisit."visitDirections", --BAD values
    					vpvisit."visitCoordSource",
    					--vpvisit."visitLatitude",
    					--vpvisit."visitLongitude",
    					vpvisit."visitVernalPool",
    					vpvisit."visitPoolType",
    					vpvisit."visitInletType",
    					vpvisit."visitOutletType",
    					vpvisit."visitForestCondition",
    					vpvisit."visitForestUpland",
    					--vpvisit."visitHabitatComment", --BAD values
    					vpvisit."visitHabitatAgriculture",
    					vpvisit."visitHabitatLightDev",
    					vpvisit."visitHabitatHeavyDev",
    					vpvisit."visitHabitatPavedRd",
    					vpvisit."visitHabitatDirtRd",
    					vpvisit."visitHabitatPowerline",
    					vpvisit."visitHabitatOther",
    					vpvisit."visitMaxDepth",
    					vpvisit."visitWaterLevelObs",
    					vpvisit."visitHydroPeriod",
    					vpvisit."visitMaxWidth",
    					vpvisit."visitMaxLength",
    					vpvisit."visitPoolTrees",
    					vpvisit."visitPoolShrubs",
    					vpvisit."visitPoolEmergents",
    					vpvisit."visitPoolFloatingVeg",
    					vpvisit."visitSubstrate",
    					vpvisit."visitDisturbDumping",
    					vpvisit."visitDisturbSiltation",
    					vpvisit."visitDisturbVehicleRuts",
    					vpvisit."visitDisturbRunoff",
    					vpvisit."visitDisturbDitching",
    					vpvisit."visitDisturbOther",
    					vpvisit."visitWoodFrogAdults",
    					vpvisit."visitWoodFrogLarvae",
    					vpvisit."visitWoodFrogEgg",
    					vpvisit."visitWoodFrogEggHow",
    					vpvisit."visitSpsAdults",
    					vpvisit."visitSpsLarvae",
    					vpvisit."visitSpsEgg",
    					vpvisit."visitSpsEggHow",
    					vpvisit."visitJesaAdults",
    					vpvisit."visitJesaLarvae",
    					vpvisit."visitJesaEgg",
    					vpvisit."visitJesaEggHow",
    					vpvisit."visitBssaAdults",
    					vpvisit."visitBssaLarvae",
    					vpvisit."visitBssaEgg",
    					vpvisit."visitBssaEggHow",
    					vpvisit."visitFairyShrimp",
    					vpvisit."visitFingerNailClams",
    					--vpvisit."visitSpeciesOther1",
    					--vpvisit."visitSpeciesOther2",
    					--vpvisit."visitSpeciesComments",
    					vpvisit."visitFish",
    					vpvisit."visitFishCount",
    					vpvisit."visitFishSizeSmall",
    					vpvisit."visitFishSizeMedium",
    					vpvisit."visitFishSizeLarge",
    					vpvisit."visitPoolPhoto",
    					vpvisit."visitUserId",
    					vpvisit."createdAt",
    					vpvisit."updatedAt",
    					vpvisit."visitPoolMapped",
    					vpvisit."visitUserIsLandowner",
    					vpvisit."visitLandownerPermission",
    					--vpvisit."visitLandowner",
    					vpvisit."visitTownId",
    					vpvisit."visitFishSize",
    					vpvisit."visitWoodFrogPhoto",
    					vpvisit."visitWoodFrogNotes",
    					vpvisit."visitSpsPhoto",
    					--vpvisit."visitSpsNotes",
    					vpvisit."visitJesaPhoto",
    					--vpvisit."visitJesaNotes",
    					vpvisit."visitBssaPhoto",
    					--vpvisit."visitBssaNotes",
    					vpvisit."visitFairyShrimpPhoto",
    					--vpvisit."visitFairyShrimpNotes",
    					vpvisit."visitFingerNailClamsPhoto",
    					--vpvisit."visitFingerNailClamsNotes",
    					vpvisit."visitNavMethodOther",
    					vpvisit."visitPoolTypeOther",
    					vpvisit."visitSubstrateOther",
    					vpvisit."visitSpeciesOtherName",
    					vpvisit."visitSpeciesOtherCount",
    					vpvisit."visitSpeciesOtherPhoto",
    					--vpvisit."visitSpeciesOtherNotes",
    					vpvisit."visitLocationUncertainty",
    					vpvisit."visitObserverUserName",
    					vpvisit."visitWoodFrogiNat",
    					vpvisit."visitSpsiNat",
    					vpvisit."visitJesaiNat",
    					vpvisit."visitBssaiNat",
    					vpvisit."visitFairyShrimpiNat",
    					vpvisit."visitFingerNailClamsiNat",
    					vpvisit."visitSpeciesOtheriNat"
    				  ) AS p
    			) AS properties
            FROM vpvisit
            ${where.text}
        ) AS f
    ) AS fc`;
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
