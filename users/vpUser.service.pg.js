const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = []; //file scope list of vpuser table columns retrieved on app startup (see 'getColumns()' below)

module.exports = {
    authenticate,
    getColumns, 
    getAll,
    getPage,
    getById,
    create,
    update,
    delete: _delete
};

pgUtil.getColumns("vpuser", staticColumns); //run it once on init: to create the array here. also diplays on console.

function getColumns() {
    return staticColumns;
}

if (!staticColumns) {
    createVpUserTable();
}

async function createVpUserTable() {
    const res = await query(`
        CREATE TABLE public.vpuser
        (
            "userid" serial,
            "username" character varying COLLATE pg_catalog."default" NOT NULL,
            "hash" uuid NOT NULL,
            "firstname" text NOT NULL,
            "lastname" text NOT NULL,
            "email" text NOT NULL,
            "userrole" text NOT NULL,
            "createdat" timestamp default now(),
            "updatedat" timestamp default now(),
            CONSTRAINT vpuser_pkey PRIMARY KEY ("username")
        )
        WITH (
            OIDS = FALSE
        )
        TABLESPACE pg_default;
        
        ALTER TABLE public.vpuser
            OWNER to vpatlas;
    `);    
}

async function authenticate({ username, password }) {
    const user = await query(`select * from vpuser where username=$1`, username);
    console.log(`vpuser.pg.service.authenticate | user: `, user);
    if (user && bcrypt.compareSync(password, user.hash)) {
        const { hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ sub: user.id, role: user.role }, config.secret);
        return {
            ...userWithoutHash,
            token
        };
    }
}

async function getAll(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select * from vpuser ${where.text};`;
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
    var where = pgUtil.whereClause(params, staticColumns); //whereClause filters output against vpuser.columns
    const text = `select (select count(*) from vpuser ${where.text}),* from vpuser ${where.text} ${orderClause} offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getById(id) {
    return await query(`select * from vpuser where "userId"=$1;`, [id])
}

async function create(body) {
    var queryColumns = pgUtil.parseColumns(body, 1, [], staticColumns);
    text = `insert into vpuser (${queryColumns.named}) values (${queryColumns.numbered})`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function update(id, body) {
    var queryColumns = pgUtil.parseColumns(body, 2, [id], staticColumns);
    text = `update vpuser set (${queryColumns.named}) = (${queryColumns.numbered}) where "userId"=$1;`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function _delete(id) {
    return await query(`delete from vpuser where "userId"=$1;`, [id]);
}