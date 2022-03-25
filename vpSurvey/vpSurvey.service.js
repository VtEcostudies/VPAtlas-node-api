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
    getPoolIds,
    getTypes,
    getObservers,
    getYears,
    getAll,
    getById,
    getByPoolId,
    getGeoJson,
    upload,
    history,
    create,
    update,
    delete: _delete
};

//file scope list of vpSurvey tables' columns retrieved at app startup (see 'getColumns()' below)
const tables = [
  "vpsurvey",
  "vpsurvey_equipment_status",
  "vpsurvey_year",
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

function getPoolIds(params={}) {
  var order = ' ORDER BY "surveyPoolId"';
  if (params.orderBy) {
      var col = params.orderBy.split("|")[0];
      var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
      order = ` ORDER BY "${col}" ${dir}`;
  }
  const where = pgUtil.whereClause(params, staticColumns);
  const text = `
  SELECT DISTINCT("surveyPoolId")
  FROM vpsurvey
  ${where.text}
  ${order}
  `;
  console.log(text, where.values);
  return query(text, where.values);
}

function getTypes() {
  const text = `
  SELECT *
  FROM def_survey_type
  `;
  return query(text);
}

function getYears(params={}) {
  const where = pgUtil.whereClause(params, staticColumns);
  const text = `
  SELECT DISTINCT("surveyYear")
  FROM vpsurvey_year
  INNER JOIN vpsurvey ON "surveyId"="surveyYearSurveyId"
  ${where.text}
  ORDER BY "surveyYear" DESC
  `;
  console.log(text, where.values);
  return query(text, where.values);
}

async function getObservers(params={}) {
  const where = pgUtil.whereClause(params, staticColumns);
  const text = `
  SELECT DISTINCT("username") AS "surveyObserver"
  FROM vpuser
  INNER JOIN vpsurvey ON id="surveyUserId"
  UNION
  SELECT DISTINCT("username") AS "surveyObserver"
  FROM vpuser
  INNER JOIN vpsurvey_amphib ON id="surveyAmphibObsId"
  ${where.text}
  ORDER BY "surveyObserver"
  `;
  console.log(text, where.values);
  return await query(text, where.values);
}

async function getAll(params={}) {
    var orderClause = 'ORDER BY "surveyDate" DESC, "surveyTime" DESC';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    //custom handling of date-range fields, for now, because 'whereClause' can't handle it
    var range = '';
    if (params.surveyDateBeg && params.surveyDateEnd) {
      range = `WHERE "surveyDate" BETWEEN '${params.surveyDateBeg}' AND '${params.surveyDateEnd}' `;
      delete params.surveyDateBeg; delete params.surveyDateEnd;
    }
    where = pgUtil.whereClause(params, staticColumns, range!=''?'AND':'WHERE');
    const text = `
    SELECT
    "townId",
    "townName",
    "countyName",
    surveyuser.username AS "surveyUserName",
    surveyuser.id AS "surveyUserId",
    vpSurvey.*,
    vpSurvey."updatedAt" AS "surveyUpdatedAt",
    vpSurvey."createdAt" AS "surveyCreatedAt",
    (SELECT array_agg(
      "surveyAmphibEdgeWOFR"+"surveyAmphibEdgeSPSA"+"surveyAmphibEdgeJESA"+"surveyAmphibEdgeBLSA"+
      "surveyAmphibInteriorWOFR"+"surveyAmphibInteriorSPSA"+"surveyAmphibInteriorJESA"+"surveyAmphibInteriorBLSA")
      AS "sumAmphib" FROM vpsurvey_amphib WHERE vpsurvey_amphib."surveyAmphibSurveyId"=vpsurvey."surveyId"),
    --vpsurvey_amphib.*,
    --to_json(vpsurvey_amphib) AS "surveyAmphib",
    (SELECT
      "surveyMacroTotalFASH"+"surveyMacroTotalCDFY"
      AS "sumMacros" FROM vpsurvey_macro WHERE vpsurvey_macro."surveyMacroSurveyId"=vpsurvey."surveyId"),
    --vpsurvey_macro.*,
    --to_json(vpsurvey_macro) AS "surveyMacros",
    --vpsurvey_year.*,
    --vpsurvey_photos.*,
    (SELECT "surveyTypeName" FROM def_survey_type WHERE def_survey_type."surveyTypeId"=vpsurvey."surveyTypeId"),
    (SELECT array_agg("surveyPhotoUrl") as "surveyPhotoUrls" FROM vpsurvey_photos WHERE
    vpsurvey."surveyId"=vpsurvey_photos."surveyPhotoSurveyId"),
    "mappedPoolId" AS "poolId",
    "mappedPoolStatus" AS "poolStatus",
    SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
    SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
    mappeduser.username AS "mappedUserName",
    vpmapped."updatedAt" AS "mappedUpdatedAt",
    vpmapped."createdAt" AS "mappedCreatedAt"
    FROM vpSurvey
    INNER JOIN vpmapped ON "mappedPoolId"="surveyPoolId"
    --INNER JOIN def_survey_type ON vpsurvey."surveyTypeId"=def_survey_type."surveyTypeId"
    --INNER JOIN vpsurvey_amphib ON "surveyId"="surveyAmphibSurveyId"
    --INNER JOIN vpsurvey_macro ON "surveyId"="surveyMacroSurveyId"
    LEFT JOIN vpsurvey_year ON "surveyId"="surveyYearSurveyId"
    --LEFT JOIN vpsurvey_photos ON "surveyId"="surveyPhotoSurveyId"
    LEFT JOIN vpuser AS surveyuser ON "surveyUserId"=surveyuser."id"
    LEFT JOIN vpuser AS mappeduser ON "mappedUserId"=mappeduser."id"
    LEFT JOIN vptown ON "mappedTownId"="townId"
    LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
    ${range + where.text} ${orderClause};`;
    console.log(text, where.values);
    return await query(text, where.values);
}

function getById(surveyId) {
  const text = `
  SELECT
  "townId",
  "townName",
  "countyName",
  surveyuser.username AS "surveyUserLogin",
  --CONCAT(surveyuser.firstname, ' ', surveyuser.lastname) AS "surveyUserFullName",
  --surveyuser.id AS "surveyUserId",
  vpSurvey.*,
  vpSurvey."updatedAt" AS "surveyUpdatedAt",
  vpSurvey."createdAt" AS "surveyCreatedAt",
  def_survey_type.*,
  (SELECT array_agg(username) AS "surveyAmphibObs"
    FROM vpsurvey_amphib
    INNER JOIN vpuser ON "surveyAmphibObsId"=id
    WHERE "surveyAmphibSurveyId"=$1),
  (SELECT array_agg
    ("surveyAmphibEdgeWOFR"+"surveyAmphibEdgeSPSA"+"surveyAmphibEdgeJESA"+"surveyAmphibEdgeBLSA"+
    "surveyAmphibInteriorWOFR"+"surveyAmphibInteriorSPSA"+"surveyAmphibInteriorJESA"+"surveyAmphibInteriorBLSA")
    AS "sumAmphib"
    FROM vpsurvey_amphib
    WHERE "surveyAmphibSurveyId"=$1),
  (SELECT
    "surveyMacroTotalFASH"+"surveyMacroTotalCDFY"
    AS "sumMacros" FROM vpsurvey_macro WHERE "surveyMacroSurveyId"=$1),
  (SELECT
    array_agg("surveyPhotoUrl") AS "surveyPhotoUrls" FROM vpsurvey_photos
  	WHERE "surveyPhotoSurveyId"=$1),
  "mappedPoolId" AS "poolId",
  "mappedPoolStatus" AS "poolStatus",
  SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 1) AS latitude,
  SPLIT_PART(ST_AsLatLonText("mappedPoolLocation", 'D.DDDDDD'), ' ', 2) AS longitude,
  mappeduser.username AS "mappedUserName",
  vpmapped."updatedAt" AS "mappedUpdatedAt",
  vpmapped."createdAt" AS "mappedCreatedAt"
  FROM vpSurvey
  INNER JOIN vpmapped ON "mappedPoolId"="surveyPoolId"
  INNER JOIN def_survey_type ON vpsurvey."surveyTypeId"=def_survey_type."surveyTypeId"
  --LEFT JOIN VPsurvey_photos ON "surveyPhotoSurveyId"="surveyId"
  LEFT JOIN vpuser AS surveyuser ON "surveyUserId"=surveyuser."id"
  LEFT JOIN vpuser AS mappeduser ON "mappedUserId"=mappeduser."id"
  LEFT JOIN vptown ON "mappedTownId"="townId"
  LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
  WHERE "surveyId"=$1`

  return query(text, [surveyId]);
}

function getByPoolId(poolId) {
  const text = `
  SELECT
  "townId",
  "townName",
  "countyName",
  surveyuser.username AS surveyUserName,
  surveyuser.id AS surveyUserId,
  surveyuser.email AS surveyUserEmail,
  vpSurvey.*,
  vpSurvey."updatedAt" AS "surveyUpdatedAt",
  vpSurvey."createdAt" AS "surveyCreatedAt",
  vpmapped.*,
  vpmapped."updatedAt" AS "mappedUpdatedAt",
  vpmapped."createdAt" AS "mappedCreatedAt"
  FROM vpSurvey
  INNER JOIN vpmapped ON "mappedPoolId"="surveyPoolId"
  LEFT JOIN vpuser AS surveyuser ON "surveyUserId"="id"
  LEFT JOIN vptown ON "mappedTownId"="townId"
  LEFT JOIN vpcounty ON "govCountyId"="townCountyId"
  WHERE "surveyPoolId"=$1`

  return query(text, [poolId]);
}

async function getGeoJson(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const sql = `
      SELECT
          row_to_json(fc) AS geojson
      FROM (
          SELECT
      		'FeatureCollection' AS type,
      		'Vermont Vernal Pool Atlas - Pool Surveys' AS name,
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
              INNER JOIN vpsurvey_amphib ON "surveyId"="surveyAmphibSurveyId"
              INNER JOIN vpsurvey_year ON "surveyId"="surveyYearSurveyId"
              ${where.text}
          ) AS f
      ) AS fc; `;
    console.log('vpSurvey.service | getGeoJson |', where.text, where.values);
    return await query(sql, where.values);
}

/*
  Upload a single csv file having one to many rows and insert/update these tables:

    - vpsurvey
    - vpsurvey_amphib
    - vpsurvey_macro
    - vpsurvey_year
    - vpsurvey_photos

  Column Names in CSV file MUST conform to specific conventions. See sample spreadsheet for details.

  Here's how it works under the hood:

  - leave vpsurvey columns at top-level object
  - store sub-tables as json objects by table name, to be inserted into jsonb columns in vpsurvey
  - DB trigger uses jsonb column sub-objects to populate join tables by surveyId AFTER INSERT
*/
function upload(req) {
  const fileRows = [];
  var logId = 0;
  var update = 0;

  return new Promise((resolve, reject) => {

    if (!req.file) {
      reject({message:`Upload file missing.`, error:true});
    }

    if (req.query) {update = 'true' == req.query.update;}

    console.log('upload | update:', update);

    insert_log_upload_attempt(req.file, update)
      .then(res => {console.log('insert_log_upload_attempt | Success |', res.rows[0]); logId=res.rows[0].surveyUploadId;})
      .catch(err => {console.log('insert_log_upload_attempt | Error |', err.message);});

      fastCsv.parseFile(req.file.path)
        .on("error", (err) => {
            console.log('vpsurvey.upload | fastCsv.parsefile ERROR', err.message);
            err.where = 'fast-csv.parseFile'; err.hint = 'File must be vpsurvey CSV format with header columns.';
            reject(err);
        })
        .on("data", (data) => {
          fileRows.push(data); // push each row
        })
        .on("end", () => {
try { //try-catch with promise doesn't work wrapped around fastCsv call. Put inside .on("end")
          fs.unlinkSync(req.file.path); //this does nothing
          const obsDelim = '_'; //delimiter for observer field prefix
          var colum = null; var split = []; var obsId = 0;
          var surveyColumns = [];
          for (i=0;i<fileRows[0].length;i++) {
            colum = fileRows[0][i];
            split = colum.split(obsDelim); colum = split[split.length-1]; obsId=(2==split.length?split[0]:0);
            if (tableColumns['vpsurvey'].includes(colum)) surveyColumns.push(colum);
          }
          surveyColumns.push('surveyAmphibJson');
          surveyColumns.push('surveyMacroJson');
          surveyColumns.push('surveyYearJson');
          surveyColumns.push('surveyPhotoJson');
          console.log('vpsurvey.upload | header', surveyColumns);
          var valArr = [];
          for (i=1; i<fileRows.length; i++) {
            var surveyRow = {}; //single object of colum:value pairs for one insert row into vpsurvey
            var amphibRow = {}; //array of objects of colum:value pairs to insert in jsonb column of vpsurvey_amphib
            var macroRow = {}; //array of objects of colum:value pairs to insert in jsonb column of vpsurvey_macro
            var yearRow = {}; //single object of colum:value pairs to insert in jsonb column of vpsurvey_year
            var photoRow = {}; //single object of colum:value pairs to insert in jsonb column of vpsurvey_photos
            var colum = null;
            var split = [];
            var obsId = 1; //obsId is 1-based for actual observers
            var value = null; //temporary local var to hold values for scrubbing
            for (j=0;j<fileRows[0].length;j++) { //iterate over keys in first row (column names)
              colum = fileRows[0][j];
              split = colum.split(obsDelim); colum = split[split.length-1]; //observer column_name is the last piece
              obsId = (2==split.length?split[0]:0); //did we get two array-elements split by '_'? If yes, flag it.
              obsId = (obsId?obsId.slice(-1):0); //if flagged above, obsId is the trailing number of 'obs2...'
              if (obsId && !amphibRow[obsId]) {amphibRow[obsId] = {};} //initialize valid amphibRow array element
              value = fileRows[i][j];
              if ('' === value) {value = null;} //convert empty strings to null
              if (`${Number(value)}` === value) {value = Number(value);} //convert string number to numbers (MUST USE '===' or it converts bool to int!!!)
              if (tableColumns['vpsurvey'].includes(colum)) {surveyRow[colum]=value;}
              if (tableColumns['vpsurvey_photos'].includes(colum)) {photoRow[colum]=value;}
              if (tableColumns['vpsurvey_year'].includes(colum)) {yearRow[colum]=value;}
              if (tableColumns['vpsurvey_macro'].includes(colum)) {macroRow[colum]=value;}
              if (tableColumns['vpsurvey_amphib'].includes(colum)) {amphibRow[obsId][colum]=value;}
              if ('surveyUserEmail'==colum && value===null) surveyRow[colum]=req.query.surveyUserEmail;
            }
            surveyRow['surveyAmphibJson'] = amphibRow; //set the vpsurvey jsonb column value for survey_amphib table
            surveyRow['surveyMacroJson'] = macroRow; //set the vpsurvey jsonb column value for survey_macro table
            surveyRow['surveyYearJson'] = yearRow; //set the vpsurvey jsonb column value for survey_year table
            surveyRow['surveyPhotoJson'] = photoRow; //set the vpsurvey jsonb column value for survey_photos table
            valArr.push(surveyRow);
          }
          var columns = [];
          var query = null;
          //https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise
          columns = new db.pgp.helpers.ColumnSet(surveyColumns, {table: 'vpsurvey'});
          query = db.pgp.helpers.insert(valArr, columns);
          if (update) {
            query += `
            ON CONFLICT ON CONSTRAINT "vpsurvey_unique_surveyPoolId_surveyTypeId_surveyDate"
            DO UPDATE SET ("${surveyColumns.join('","')}")=(EXCLUDED."${surveyColumns.join('",EXCLUDED."')}")`;
          }
          query += ' RETURNING "surveyId", "surveyPoolId", "createdAt"!="updatedAt" AS updated ';
          console.log('vpsurvey.upload | query', query); //verbatim query with values for testing
          //console.log('vpsurvey.upload | columns', columns);
          //console.log('vpsurvey.upload | values', valArr);

} catch (err) {
  console.log('vpsurvey.upload | try-catch ERROR', err.message);
  reject(err);
}

          db.pgpDb.many(query) //'many' for expected return values
            .then(res => {
              console.log(res);
              update_log_upload_attempt(logId, {
                surveyUploadSuccess:true,
                surveyUploadRowCount:res.length,
                surveyUploadSurveyId:res
                });
              resolve(res);
            })
            .catch(err => {
              console.log(err.message);
              update_log_upload_attempt(logId, {
                surveyUploadSuccess:false,
                surveyUploadError:err.message,
                surveyUploadDetail:err.detail
                });
              reject(err);
            }); //end pgpDb
        }); //end fastCSV.parsefile
    }); //end Promise
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
async function insert_log_upload_attempt(body={}, update=false) {
  var columns = {};
  columns.named = [`"surveyUpload_fieldname"`,`"surveyUpload_mimetype"`,`"surveyUpload_path"`,`"surveyUpload_size"`,`"surveyUploadType"`];
  columns.numbered = ['$1','$2','$3','$4','$5'];
  columns.values = [body.fieldname,body.mimetype,body.path,body.size,update?'update':'insert'];
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
  vpSurvey INSERT uses server-side TRIGGER functions to handle the different tables.

  See upload for how that's handled.
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
    var queryColumns = pgUtil.parseColumns(body, 2, [id], staticColumns);
    text = `update vpSurvey set (${queryColumns.named}) = (${queryColumns.numbered}) where "surveyId"=$1 returning "surveyId"`;
    console.log(text, queryColumns.values);
    return new Promise(async (resolve, reject) => {
      await query(text, queryColumns.values)
        .then(res => {resolve(res);})
        .catch(err => {reject(err);});
    })
}

async function _delete(id) {
    return await query(`delete from vpsurvey where "surveyId"=$1 CASCADE;`, [id]);
}

async function history(params={}) {
  const where = pgUtil.whereClause(params, staticColumns);
  const text = `
  SELECT *
  FROM vpsurvey_uploads
  ${where.text}
  `;
  console.log(text, where.values);
  return await query(text, where.values);
}
