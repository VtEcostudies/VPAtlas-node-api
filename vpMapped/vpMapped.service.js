const db = require('_helpers/db_postgres');
const query = db.query;
var staticColumns = []; //file scope list of vpmapped table columns retrieved on app startup (see 'getColumns()' below)

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

/*
Load just columns from the db to populate our static list here for use in
parsing request bodies for correct columns.
 */
async function getColumns() {
    const text = `select * from vpmapped limit 0;`;
    res = await query(text)
        .then(res => {
            res.fields.forEach(fld => {
                staticColumns.push(String(fld.name));
            });
            console.log('vpMapped columns:', staticColumns);
            return res;
        })
        .catch(err => {
            return err;
        });
}

getColumns(); //run it once on init

function whereClause(params={}) {
    var where = '';
    var values = [];
    var idx = 1;
    if (Object.keys(params).length) {
        for (var key in params) {
            var col = key.split("|")[0];
            var opr = key.split("|")[1]; opr = opr ? opr : '=';
            if (staticColumns.includes(col)) {
                if (where == '') where = 'where';
                values.push(params[key]);
                if (idx > 1) where += ' AND ';
                where += ` "${col}" ${opr} $${idx++}`;
            }
        }
    }
    return { 'text': where, 'values': values };
}

/*
Parse {column:value, ...} pairs from incoming http request object into structures used by postgres
 */
function parseColumns(body={}, idx=1, cValues=[]) {
    var cNames = ''; // "username,email,zipcode,..."
    var cNumbr = ''; // "$1,$2,$3,..."
    //var values = []; // [twerkman, twerker@gmail.com, 09183, ...]
    //var idx = 1;
    if (Object.keys(body).length) {
        for (var key in body) {
            if (staticColumns.includes(key)) { //test for key (db column) in staticColumns, a file-scope array of db columns generated at server startup
                cValues.push(body[key]);
                cNames += `"${key}",`;
                cNumbr += `$${idx++},`;
            }
        }
        //remove leading and trailing commas
        cNames = cNames.replace(/(^,)|(,$)/g, "");
        cNumbr = cNumbr.replace(/(^,)|(,$)/g, "");
    }
    console.log(`vpMapped.service.js | parseColumns | column list: ${cNames}`)
    return { 'named': cNames, 'numbered': cNumbr, 'values': cValues };
}

async function getCount(body={}) {
    const where = whereClause(body);
    const text = `select count(*) from vpmapped ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getAll(body={}) {
    const where = whereClause(body);
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
    var where = whereClause(params); //whereClause filters output agains vpmapped.columns
    const text = `select (select count(*) from vpmapped ${where.text}),* from vpmapped ${where.text} ${orderClause} offset ${offset} limit ${pageSize};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getById(id) {
    return await query(`select * from vpmapped where "mappedPoolId"=$1;`, [id])
}

async function create(body) {
    var queryColumns = parseColumns(body);
    text = `insert into vpmapped (${queryColumns.named}) values (${queryColumns.numbered})`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function update(id, body) {
    var queryColumns = parseColumns(body, 2, [id]);
    text = `update vpmapped set (${queryColumns.named}) = (${queryColumns.numbered}) where "mappedPoolId"=$1;`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

async function _delete(id) {
    return await query(`delete from vpmapped where "mappedPoolId"=$1;`, [id]);
}