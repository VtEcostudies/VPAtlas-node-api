const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = [];

module.exports = {
    getColumns,
    getAll,
    getCount,
    getPage,
    getById,
    create,
    update,
    delete: _delete
};

//file scope list of vpmapped table columns retrieved on app startup (see 'getColumns()' below)
pgUtil.getColumns("vpmapped", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {return res;})
    .catch(err => {
        console.log(`vpMapped.service.pg.pgUtil.getColumns | error: `, err.message);
        createVpMappedTable()
            .then(res => {
                pgUtil.getColumns("vpmapped", staticColumns);
                importCSV()
                    .then(res => {return res;})
                    .catch(err => {return err;});
            })
            .catch(err => {
                return err;
            });
        });

function getColumns() {
    console.log(`vpMapped.service.pg.getColumns | staticColumns:`, staticColumns);
    return staticColumns;
}

async function createVpMappedTable() {
    await query(
    `
    CREATE TYPE confidence AS ENUM ('L','ML','M','MH','H');
    CREATE TYPE locationaccuracy AS ENUM ('L','ML','M','MH','H');

    CREATE TABLE IF NOT EXISTS vpmapped
    (
        "mappedPoolId" text NOT NULL,
        "mappedByUser" text,
        "mappedByUserId" integer,
        "mappedDateText" date,
        "mappedDateUnixSeconds" bigint,
        "mappedLatitude" real NOT NULL,
        "mappedLongitude" real NOT NULL,
        "mappedConfidence" confidence,
        "mappedSource" text,
        "mappedSource2" text,
        "mappedPhotoNumber" text,
        "mappedLocationAccuracy" locationaccuracy,
        "mappedShape" text,
        "mappedComments" text,
        "createdAt" timestamp default now(),
        "updatedAt" timestamp default now()
    );
    
    ALTER TABLE vpmapped OWNER TO vpatlas;
    ALTER TABLE vpmapped DROP CONSTRAINT IF EXISTS vpmapped_pkey;
    ALTER TABLE vpmapped ADD CONSTRAINT vpmapped_pkey PRIMARY KEY ("mappedPoolId");
    `)
    .then(res => {
        console.log(`createVpMappedTable() | res:`, res);
        return res;
    })
    .catch(err => {
        console.log(`createVpMappedTable() | err:`, err.message);
        throw err;
    });
}

async function importCSV(csvFileName='~/data/import/vpmapped.csv') {
    await query(`
    COPY vpmapped(
        "mappedPoolId",
        "mappedByUser",
        "mappedByUserId",
        "mappedDateText",
        "mappedDateUnixSeconds",
        "mappedLatitude",
        "mappedLongitude",
        "mappedConfidence",
        "mappedSource",
        "mappedSource2",
        "mappedPhotoNumber",
        "mappedLocationAccuracy",
        "mappedShape",
        "mappedComments",
        "createdAt",
        "updatedAt"        
    )
    FROM '${csvFileName}' DELIMITER ',' CSV HEADER;
    `)
    .then(res => {
        console.log(`vpMapped.service.importCSV() | res:`, res);
        return res;
    })
    .catch(err => {
        console.log(`vpMapped.service.importCSV() | err:`, err.message);
        throw err;
    });
}

async function getCount(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select count(*) from vpmapped ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getAll(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select * from vpmapped ${where.text};`;
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
    const text = `select (select count(*) from vpmapped ${where.text}),* from vpmapped ${where.text} ${orderClause} offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getById(id) {
    return await query(`select * from vpmapped where "mappedPoolId"=$1;`, [id])
}

async function create(body) {
    var queryColumns = pgUtil.parseColumns(body, 1, [], staticColumns);
    text = `insert into vpmapped (${queryColumns.named}) values (${queryColumns.numbered})`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function update(id, body) {
    console.log(`vpMapped.service.update | before pgUtil.parseColumns`, staticColumns);
    var queryColumns = pgUtil.parseColumns(body, 2, [id], staticColumns);
    text = `update vpmapped set (${queryColumns.named}) = (${queryColumns.numbered}) where "mappedPoolId"=$1;`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function _delete(id) {
    return await query(`delete from vpmapped where "mappedPoolId"=$1;`, [id]);
}