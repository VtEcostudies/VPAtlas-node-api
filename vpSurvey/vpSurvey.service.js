const fs = require('fs');
const fastCsv = require('fast-csv');

const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
var staticColumns = []; //all tables' columns in a single 1D array
var tableColumns = []; //each table's columns by table name

module.exports = {
    getColumns,
    getCount,
    getAll,
    getById,
    getByPoolId,
    getGeoJson,
    upload,
    create,
    update,
    delete: _delete
};

//file scope list of vpSurvey tables' columns retrieved at app startup (see 'getColumns()' below)
const tables = [
  "vpsurvey",
  "vpsurvey_equipment_status",
  "vpsurvey_year",
  //"vpsurvey_species",
  "vpsurvey_amphib",
  "vpsurvey_macro",
  "vpsurvey_photos",
  "vpsurvey_uploads",
  "vptown"
];
for (i=0; i<tables.length; i++) {
  pgUtil.getColumns(tables[i], staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
      tableColumns[res.tableName] = res.tableColumns;
      //console.log(tableColumns);
      return res;
    })
    .catch(err => {console.log(`vpSurvey.service.pg.pgUtil.getColumns | table:${tables[i]} | error: `, err.message);});
}

function getColumns() {
    return new Promise((resolve, reject) => {
      console.log(`vpSurvey.service.pg.getColumns | staticColumns:`, staticColumns);
      resolve(staticColumns);
    });
}

async function getCount(query={}) {
    const where = pgUtil.whereClause(query, staticColumns);
    const text = `select count(*) from vpSurvey ${where.text};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

async function getAll(params={}) {
    var orderClause = 'order by "surveyId" desc';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    const where = pgUtil.whereClause(params, staticColumns);
    const text = `
    SELECT
    "townId",
    "townName",
    "countyName",
    vpSurvey.*,
    vpSurvey."updatedAt" AS "surveyUpdatedAt",
    vpSurvey."createdAt" AS "surveyCreatedAt",
    vpmapped.*,
    vpmapped."updatedAt" AS "mappedUpdatedAt",
    vpmapped."createdAt" AS "mappedCreatedAt"
    FROM vpSurvey
    INNER JOIN vpmapped ON "mappedPoolId"="surveyPoolId"
    LEFT JOIN vptown ON "mappedTownId"="townId"
    LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
    ${where.text} ${orderClause};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

function getById(id) {
  return getBy({column:'surveyId', value:id});
}
function getByPoolId(id) {
  return getBy({column:'surveyPoolId', value:id});
}
async function getBy(getBy={column:'surveyId', value:1}) {
    const text = `
    SELECT
    "townId",
    "townName",
    "countyName",
    vpSurvey.*,
    vpSurvey."updatedAt" AS "surveyUpdatedAt",
    vpSurvey."createdAt" AS "surveyCreatedAt",
    vpmapped.*,
    vpmapped."updatedAt" AS "mappedUpdatedAt",
    vpmapped."createdAt" AS "mappedCreatedAt"
    FROM vpSurvey
    INNER JOIN vpmapped ON "mappedPoolId"="surveyPoolId"
    LEFT JOIN vptown ON "mappedTownId"="townId"
    LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
    WHERE "${getBy.column}"=$1;`;
    return await query(text, [getBy.value])
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
      			         ST_AsGeoJSON(
                       ST_GeomFromText('POINT(' || "mappedLongitude" || ' ' || "mappedLatitude" || ')'))::json
                       AS geometry,
                  (SELECT
                    vpsurvey.*
      				row_to_json(p) FROM (SELECT
      				) AS p
      			) AS properties
              FROM vpSurvey
          		INNER JOIN vpmapped ON "mappedPoolId"="surveyPoolId"
              INNER JOIN vpsurvey_species ON "surveyId"="surveySpeciesSurveyId"
              INNER JOIN vpsurvey_year ON "surveyId"="surveyYearSurveyId"
              ${where.text}
          ) AS f
      ) AS fc; `;
    console.log('vpSurvey.service | getGeoJson |', where.text, where.values);
    return await query(sql, where.values);
}

/*
  Upload to multiple tables from single csv file to create vpsurvey, survey_observer_species_counts, survey_year

  Column Names in CSV file MUST conform to specific conventions. See sample spreadsheet for details.

  - leave vpsurvey columns at top-level object
  - store sub-tables as json objects by table name, to be inserted into jsonb columns in vpsurvey
  - DB trigger uses jsonb column sub-objects to populate join tables by surveyId AFTER INSERT
*/
async function upload(req) {
  const fileRows = [];
  var logId = 0;

  return new Promise(async (resolve, reject) => {

    if (!req.file) {
      reject({message:`Upload file missing.`, error:true});
    }

    insert_log_upload_attempt(req.file)
      .then(res => {console.log('insert_log_upload_attempt | Success |', res.rows[0]); logId=res.rows[0].surveyUploadId;})
      .catch(err => {console.log('insert_log_upload_attempt | Error |', err.message);});

    try {
      fastCsv.parseFile(req.file.path)
        .on("data", (data) => {
          fileRows.push(data); // push each row
        })
        .on("end", async () => {
          fs.unlinkSync(req.file.path); //this does nothing
          const obsDelim = '_'; //delimiter for observer field prefix
          var colum = null; var split = []; var obsId = 0;
          var surveyColumns = [];
          for (i=0;i<fileRows[0].length;i++) {
            colum = fileRows[0][i];
            split = colum.split(obsDelim); colum = split[split.length-1]; obsId=(2==split.length?split[0]:0);
            if (tableColumns['vpsurvey'].includes(colum)) surveyColumns.push(colum);
          }
          //surveyColumns.push('surveySpeciesJson');
          surveyColumns.push('surveyAmphibJson');
          surveyColumns.push('surveyMacroJson');
          surveyColumns.push('surveyYearJson');
          //console.log('vpsurvey header', surveyColumns);
          var valArr = [];
          for (i=1;i<fileRows.length;i++) {
            //var speciesRow = {}; //array of objects of colum:value pairs to insert in jsonb column of vpsurvey_species
            var surveyRow = {}; //single object of colum:value pairs for one insert row into vpsurvey
            var amphibRow = {}; //array of objects of colum:value pairs to insert in jsonb column of vpsurvey_amphib
            var macroRow = {}; //array of objects of colum:value pairs to insert in jsonb column of vpsurvey_macro
            var yearRow = {}; //single object of colum:value pairs to insert in jsonb column of vpsurvey_year
            var colum = null;
            var split = [];
            var obsId = 0; //obsId of zero means both obs or joint obs?
            var value = null; //temporary local var to hold values for scrubbing
            for (j=0;j<fileRows[0].length;j++) {
              colum = fileRows[0][j];
              split = colum.split(obsDelim); colum = split[split.length-1];
              obsId = (2==split.length?split[0]:0); obsId = (obsId?obsId.slice(-1):0);
              //if (!speciesRow[obsId]) {speciesRow[obsId] = {};} //initialize speciesRow array element
              if (!amphibRow[obsId]) {amphibRow[obsId] = {};} //initialize amphibRow array element
              value = fileRows[i][j];
              if ('' === value) {value = null;}
              if (tableColumns['vpsurvey'].includes(colum)) {surveyRow[colum]=value;}
              if (tableColumns['vpsurvey_year'].includes(colum)) {yearRow[colum]=value;}
              if (tableColumns['vpsurvey_macro'].includes(colum)) {macroRow[colum]=value;}
              if (tableColumns['vpsurvey_amphib'].includes(colum)) {amphibRow[obsId][colum]=value;}
              //if (tableColumns['vpsurvey_species'].includes(colum)) {speciesRow[obsId][colum]=value;}
            }
            //surveyRow['surveySpeciesJson'] = speciesRow; //set the jsonb column value for survey_species table
            surveyRow['surveyAmphibJson'] = amphibRow; //set the jsonb column value for survey_amphib table
            surveyRow['surveyMacroJson'] = macroRow; //set the jsonb column value for survey_macro table
            surveyRow['surveyYearJson'] = yearRow; //set the jsonb column value for survey_year table
            valArr.push(surveyRow);
          }

          //https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise
          const columns = new db.pgp.helpers.ColumnSet(surveyColumns, {table: 'vpsurvey'});
          const query = db.pgp.helpers.insert(valArr, columns);
          //to-do: add returning clause to query to get info about results on successful insert
          console.log(query);
          //console.log(columns);
          //console.log(valArr);
          await db.pgpDb.none(query)
            .then(res => {
              console.log(res);
              update_log_upload_attempt(logId, {
                surveyUploadSuccess:true,
                surveyUploadRowCount:fileRows.length-1
                });
              resolve(res);
            })
            .catch(err => {
              console.log(err.message);
              update_log_upload_attempt(logId, {
                surveyUploadSuccess:false,
                surveyUploadError:err.message
                });
              reject(err);
            });
        })
    } catch(err) {
      reject(err);
    }

    });
}
/*
upload req.file:
{
  fieldname: 'vpsurvey.csv',
  originalname: 'vpsurvey.csv',
  encoding: '7bit',
  mimetype: 'text/csv',
  destination: 'vpsurvey/uploads/',
  filename: '532fa603b058c6c6c9672bdf1ea50e8f',
  path: 'vpsurvey\\uploads\\532fa603b058c6c6c9672bdf1ea50e8f',
  size: 1971
}
*/
async function insert_log_upload_attempt(body={}) {
  var columns = {};
  columns.named = [`"surveyUpload_fieldname"`,`"surveyUpload_mimetype"`,`"surveyUpload_path"`,`"surveyUpload_size"`];
  columns.numbered = ['$1','$2','$3','$4'];
  columns.values = [body.fieldname,body.mimetype,body.path,body.size];
  text = `insert into vpsurvey_uploads (${columns.named}) values (${columns.numbered}) returning "surveyUploadId"`;
  console.log('vpSurvey.service::log_upload_attempt', text, columns.values);
  return await query(text, columns.values);
}

async function update_log_upload_attempt(surveyUploadId=0, body={}) {
  var columns = pgUtil.parseColumns(body, 2, [surveyUploadId], staticColumns);
  text = `update vpsurvey_uploads set (${columns.named}) = (${columns.numbered}) where "surveyUploadId"=$1`;
  console.log('vpSurvey.service::log_upload_attempt', text, columns.values);
  return await query(text, columns.values);
}

/*
  vpSurvey INSERT probably needs a server-side function to handle the different tables.
*/
async function create(body) {
    var queryColumns = pgUtil.parseColumns(body, 1, [], staticColumns);
    text = `insert into vpsurvey (${queryColumns.named}) values (${queryColumns.numbered}) returning "surveyId"`;
    console.log(text, queryColumns.values);
    return new Promise(async (resolve, reject) => {
      await query(text, queryColumns.values)
        .then(res => {resolve(res);})
        .catch(err => {reject(err);});
    })
}

async function update(id, body) {
    console.log(`vpSurvey.service.update | before pgUtil.parseColumns`, staticColumns);
    var queryColumns = pgUtil.parseColumns(body, 2, [id], staticColumns);
    text = `update vpSurvey set (${queryColumns.named}) = (${queryColumns.numbered}) where "surveyId"=$1 returning "surveyId"`;
    console.log(text, queryColumns.values);
    return new Promise(async (resolve, reject) => {
      await query(text, queryColumns.values)
        .then(async rev => {
          var qry = `update vpmapped set "mappedPoolStatus"=$1 where "mappedPoolId"=$2 returning $3::int as "surveyId"`;
          var val = [body.reviewPoolStatus, body.surveyPoolId, rev.rows[0].surveyId];
          console.log('vpSurvey.service::update', qry, val);
          await query(qry, val)
            .then(res => {resolve(res);})
            .catch(err => {reject(err);});
        })
        .catch(err => {reject(err);});
    })
}

async function _delete(id) {
    return await query(`delete from vpsurvey where "surveyId"=$1 CASCADE;`, [id]);
}
