﻿/*
    Mid-Alpha development, the team decided that 'Mapped Pools' and 'Pool Visits'
    should just be one list of items having different amounts of data. This module
    serves the gets for those joined table queries.
*/
const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = [];

module.exports = {
    getCount,
    getAll,
    getPage
};


//file scope list of vpvisit table columns retrieved on app startup (see 'getColumns()' below)
pgUtil.getColumns("vpmapped", staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
        staticColumns.push(`vptown."townName"`); //Add this for town filter query
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

async function getCount(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select count(*) from vpvisit ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getAll(params={}) {
    var orderClause = 'order by "mappedPoolId"';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    const where = pgUtil.whereClause(params, staticColumns);
    const text = `
SELECT (SELECT COUNT(*) FROM vpmapped LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId" ${where.text}) AS count,
vpmapped.*, to_json(vptown) AS "mappedTown",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpmapped."createdAt" AS "mappedCreatedAt",
vpmapped."mappedPoolId" AS "poolId",
vpmapped."mappedLatitude" AS "latitude",
vpmapped."mappedLongitude" AS "longitude",
vpvisit.*, 
vpvisit."updatedAt" AS "visitUpdatedAt",
vpvisit."createdAt" AS "visitCreatedAt"
from vpmapped
LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
LEFT JOIN vptown ON vpmapped."mappedTownId"=vptown."townId"
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
SELECT (SELECT COUNT(*) FROM vpmapped LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId" ${where.text}) AS count,
vpmapped.*, to_json(vptown) AS "mappedTown",
vpmapped."updatedAt" AS "mappedUpdatedAt",
vpmapped."createdAt" AS "mappedCreatedAt",
vpmapped."mappedPoolId" AS "poolId",
vpmapped."mappedLatitude" AS "latitude",
vpmapped."mappedLongitude" AS "longitude",
vpvisit.*, 
vpvisit."updatedAt" AS "visitUpdatedAt",
vpvisit."createdAt" AS "visitCreatedAt"
from vpmapped
LEFT JOIN vpvisit ON vpvisit."visitPoolId"=vpmapped."mappedPoolId"
LEFT JOIN vptown ON vpmapped."mappedTownId"=vptown."townId"
${where.text} ${orderClause} offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}
