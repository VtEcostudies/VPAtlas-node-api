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
    console.log(`vpUser.service.getColumns | staticColumns:`, staticColumns);
    return staticColumns;
}

//run it once on init: to create the array here. also diplays on console.
pgUtil.getColumns("vpuser", staticColumns)
    .then(res => {return res;})
    .catch(err => {
        console.log(`vpUser.service.pg.pgUtil.getColumns`, err.message);
    });
    
async function authenticate(body) {
    if (!body.username || !body.password) {throw 'Username and password are required.';}
    try {
        const res = await query(`select * from vpuser where username=$1`, [body.username]);
        const user = res.rows[0];
        console.log(`vpuser.pg.service.authenticate | user: `, user);
        if (user && bcrypt.compareSync(body.password, user.hash)) {
            delete user.hash;
            const token = jwt.sign({ sub: user.id, role: user.userrole }, config.secret);
            return { //interesting - this generates object key:value pairs from variable names and content...
                user,
                token
            };
        } else {
            throw 'Username or password is incorrect.';
        }
    } catch(err) {
        throw 'Username or password is incorrect.';
    }
}

async function getAll(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select * from vpuser ${where.text};`;
    console.log(`vpUser.service.pg.js getAll`, text, where.values);
    try {
        var res = await query(text, where.values);
        return res.rows;
    } catch(err) {
        throw err;
    }
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
    console.log(`vpUser.service.pg.js getPage`, text, where.values);
    try {
        var res = await query(text, where.values);
        return res.rows;
    } catch(err) {
        throw err;
    }
}

/*
 * NOTE: tried handling promise, here, with .catch, .then. Doesn't work
 * with await. Neither does it appear to work without await. See commented
 * code below.
 *
 * It does appear that await is meant to be used with the old-school try {}
 * catch {} formulation.
 */
async function getById(id) {
    try {
        var res = await query(`select * from vpuser where "id"=$1;`, [id]);
        if (res.rowCount == 1) {
            delete res.rows[0].hash;
            return res.rows[0];
        } else {
            console.log(`vpUser.service.pg.js::getByID ${id} NOT Found`);
            return {};
        }
    } catch(err) {
        console.log(`vpUser.service.pg.js::getByID error`, err);
        throw err;
    }
/* this doesn't work
    query(`select * from vpuser where "id"=$1;`, [id])
        .catch(err => {
            return res.rows[0];
            console.log('vpUser.service.pg.js::getById error', err);
            throw err;
                })        return res;

        .then(res => {
            var user = res.rows[0];
            delete user.hash;
            return user;
        });
*/
}

async function getByUserName(username) {
    try {
        var res = await query(`select * from vpuser where "username"=$1;`, [username]);
        if (res.rowCount == 1) {
            delete res.rows[0].hash;
            return res.rows[0];
        } else {
            console.log(`vpUser.service.pg.js::getByID ${id} NOT Found`);
            return {};
        }
    } catch(err) {
        console.log(`vpUser.service.pg.js::getByID error`, err);
        throw err;
    }
}

async function create(body) {

    // hash password, add to body object, delete password from body object
    if (body.password) {
        body.hash = bcrypt.hashSync(body.password, 10);
        delete body.password;
    }
    
    body.userrole = 'user'; //new users are all just users.

    var queryColumns = pgUtil.parseColumns(body, 1, [], staticColumns);
    text = `insert into vpuser (${queryColumns.named}) values (${queryColumns.numbered})`;
    console.log(text, queryColumns.values);
    try {
        var res = await query(text, queryColumns.values);
        return res;
    } catch(err) {
        console.log(err);
        if (err.code == 23505 && err.constraint == 'vpuser_pkey') {
            err.name = 'Uniqueness Constraint Violation';
            err.hint = 'Please choose a different username.';
            err.message = `username '${body.username}' is already taken.`;
        }
        if (err.code == 23502) {
            err.name = 'Not-null Constraint Violation';
            err.hint = 'Please enter all required values.';
            delete err.detail; //contains entire existing record - insecure
        }
        throw err;
    }
/* This did seem to work... weird.
    await query(text, queryColumns.values)
        .catch(err => {
            console.log(err);
            if (err.code == 23505 && err.constraint == 'vpuser_pkey') {
                err.name = 'Uniqueness Constraint Violation';
                err.hint = 'Please choose a different username.';
                err.message = `username '${body.username}' is already taken.`;
            }
            throw err;
            })
        .then(res => {return res;});
*/
}

async function update(id, body) {

    // hash password into body
    if (body.password) {
        body.hash = bcrypt.hashSync(body.password, 10);
        delete body.password;
    }

    delete body.userrole; //don't allow role change on update yet.
    
    var queryColumns = pgUtil.parseColumns(body, 2, [id], staticColumns);
    text = `update vpuser set (${queryColumns.named}) = (${queryColumns.numbered}) where "id"=$1;`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function _delete(id) {
    return await query(`delete from vpuser where "id"=$1;`, [id]);
}