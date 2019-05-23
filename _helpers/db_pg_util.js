const db = require('_helpers/db_postgres');
const query = db.query;

module.exports = {
  getColumns: (tableName, columns) => getColumns(tableName, columns),
  whereClause: (params, columns) => whereClause(params, columns),
  parseColumns: (body, idx, cValues, staticColumns) => parseColumns(body, idx, cValues, staticColumns)
}

/*
    Load just columns from the db and return array of columns.
    
    CORRECTION: it DOES NOT WORK to return an array.
    
    HOWEVER: it does work to pass and array as an argument to
    this funtion, by reference, and update that array here.
    
    OPTIONS: (1) Pass an empty array to be filled here, or
    (2) Use the object returned from here.
    
 */
async function getColumns(tableName, columns=[]) {
    
    const text = `select * from ${tableName} limit 0;`;
    
    await query(text)
        .then(res => {
            res.fields.forEach(fld => {
                columns.push(String(fld.name));
            });
            console.log(`${tableName} columns:`, columns);
            return {tableName: columns};
        })
        .catch(err => {
            throw err;
        });
}

/*
    Parse route query params into valid pg-Postgres where clause parameter list.
    This returns an object having where-clause text and values, which looks like
    the following:
    
    text: WHERE "column1" = $1 AND "column2" LIKE $2 AND ...
    
    values: []
    
    We created a home-grown syntax for sending a logical comparison operator to
    this API using the pipe ("|") when an operator other than "=" is desired. An
    example is:
    
    GET http://vpatlas.org/pools/mapped/page?mappedPoolId|LIKE='AAA' (roughly)
    
    Arguments:
       params: a valid express query param object
       staticColumns: array of valid columns in the table
    
 */
function whereClause(params={}, staticColumns=[]) {
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
    Parse {column:value, ...} pairs from incoming http req.body object into structures used by postgres
    
    This works for postgres INSERT and UPDATE queries by allowing for injection of a starting index and
    pre-populated array of values.
    
    Arguments:
    
    body: an express req.body object
    idx: positive integer starting value for the returned 'numbered' value list
    cValue: empty or pre-populated array of query values
    staticColumns: array of valid columns in the table
    
    returns object having:
    {
        'named': "username,email,zipcode,..."
        'numbered': $1,$2,$3,...
        'values': ['jdoh','jdoh@dohsynth.com','91837',...]
    }
 */
function parseColumns(body={}, idx=1, cValues=[], staticColumns=[]) {
    var cNames = ''; // "username,email,zipcode,..."
    var cNumbr = ''; // "$1,$2,$3,..."
    
    //console.log(`db_pg_util.parseColumns`, body, idx, cValues, staticColumns);
    
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
    
    return { 'named': cNames, 'numbered': cNumbr, 'values': cValues };
}