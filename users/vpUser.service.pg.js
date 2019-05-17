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
    getByUserName,
    create,
    update,
    delete: _delete
};

function getColumns() {
    return staticColumns;
}

//run it once on init: to create the array here. also diplays on console.
pgUtil.getColumns("vpuser", staticColumns)
    .catch(err => {
        console.log(`vpUser.service.pg.pgUtil.getColumns`, err);
        createVpUserTable();
        });

async function createVpUserTable() {
    const res = await query(`
        CREATE TABLE public.vpuser
        (
            "userid" serial,
            "username" character varying COLLATE pg_catalog."default" NOT NULL,
            "hash" text NOT NULL,
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
    pgUtil.getColumns("vpuser", staticColumns);
}

async function authenticate(body) {
    if (!body.username || !body.password) {throw 'Missing username or password.';}
    const res = await query(`select * from vpuser where username=$1`, [body.username]);
    if (res.rowCount != 1) throw 'User not found.';
    const user = res.rows[0];
    console.log(`vpuser.pg.service.authenticate | user: `, user);
    if (user && bcrypt.compareSync(body.password, user.hash)) {
        //const { hash, ...userNoHash } = user.toObject();
        var userWithoutHash = user;
        delete userWithoutHash.hash;
        const token = jwt.sign({ sub: user.id, role: user.userrole }, config.secret);
        return {
            userWithoutHash,
            token
        };
    } else {
        return;
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
    const user = await query(`select * from vpuser where "userId"=$1;`, [id])
    const { hash, ...userWithoutHash } = user.toObject();
    return { ...userWithoutHash };
}

async function getByUserName(username) {
    const user = await query(`select * from vpuser where "username"=$1;`, [username]);
    const { hash, ...userWithoutHash } = user.toObject();
    return { ...userWithoutHash };
}

async function create(body) {

    // hash password into body
    if (body.password) {
        body.hash = bcrypt.hashSync(body.password, 10);
        delete body.password;
    }
    
    body.userrole = 'guest'; //new users are all guests.

    var queryColumns = pgUtil.parseColumns(body, 1, [], staticColumns);
    text = `insert into vpuser (${queryColumns.named}) values (${queryColumns.numbered})`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function update(id, body) {

    // hash password into body
    if (body.password) {
        body.hash = bcrypt.hashSync(body.password, 10);
        delete body.password;
    }

    delete body.userrole; //don't allow role change on update yet.
    
    var queryColumns = pgUtil.parseColumns(body, 2, [id], staticColumns);
    text = `update vpuser set (${queryColumns.named}) = (${queryColumns.numbered}) where "userId"=$1;`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function _delete(id) {
    return await query(`delete from vpuser where "userId"=$1;`, [id]);
}