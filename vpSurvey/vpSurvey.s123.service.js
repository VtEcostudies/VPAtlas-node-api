const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
const fetch = require('node-fetch')
var staticColumns = []; //all tables' columns in a single 1D array
var tableColumns = []; //each table's columns by table name

module.exports = {
    getS123Data,
    getUpsertS123Data
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
      return res;
    })
    .catch(err => {console.log(`vpSurvey.service.pg.pgUtil.getColumns | table:${tables[i]} | error: `, err.message);});
}

/*
https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services/
service_fae86d23c46e403aa0dae67596be6073
/FeatureServer/
0/1
?f=pjson
*/
function getS123Data(req) {
  const apiUrl = 'https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services';
  const srvId = 'service_fae86d23c46e403aa0dae67596be6073';
  var appId = 0;
  var objId = 1;
  var args = 'f=pjson';
  if (req.query) {
    appId = req.query.appId?req.query.appId:0;
    objId = req.query.objectId?req.query.objectId:1;
  }
  return new Promise((resolve, reject) => {
    const url = `${apiUrl}/${srvId}/FeatureServer/${appId}/${objId}?${args}`;
    fetch(url)
      .then(res => res.json()) //this step is necessary when using fetch. without it, result is garbage.
      .then(json => {
        if (json.error) {
          json.error.hint = url;
          json.error.detail = json.error.details;
          console.log('vpSurvey.s123.service::getData | ERROR', json);
          reject(json.error);
        } else {
          console.log('vpSurvey.s123.service::getData | SUCCESS', json.feature.attributes);
          resolve(json.feature.attributes);
        }
      })
      .catch(err => {
        console.log('vpSurvey.s123.service::getData | ERROR', err.message);
        reject(err);
      })
  });
}

function getUpsertS123Data(req) {
  return new Promise((resolve, reject) => {
    getS123Data(req)
      .then(jsonData => {
        upsert(req, [jsonData]) //put a single json Data object into array for future multi-object upsert
          .then(res => {resolve(res);})
          .catch(err => {reject(err);})
      })
      .catch(err => {
        console.log('vpSurvey.s123.service::getUpsertS123Data | ERROR', err.message);
        reject(err);
      });
    });
}

function upsert(req, jsonArr) {
  var update = 0;
  return new Promise((resolve, reject) => {
    try {
      if (req.query) {update = !!req.query.update;}
      const obsDelim = '_'; //delimiter for observer field prefix
      var colum = null; var split = []; var obsId = 0;
      var surveyColumns = [];
      Object.keys(jsonArr[0]).forEach(colum => {
        split = colum.split(obsDelim); colum = split[split.length-1]; obsId=(2==split.length?split[0]:0);
        if (tableColumns['vpsurvey'].includes(colum)) surveyColumns.push(colum);
      });
      surveyColumns.push('surveyAmphibJson');
      surveyColumns.push('surveyMacroJson');
      surveyColumns.push('surveyYearJson');
      surveyColumns.push('surveyPhotoJson');
      console.log('vpsurvey.s123.upsert | header', surveyColumns);
      var valArr = [];
      for (i=0; i<jsonArr.length; i++) { //iterate over jsonData objects in jsonArray
        var surveyRow = {}; //single object of colum:value pairs for one insert row into vpsurvey
        var amphibRow = {}; //array of objects of colum:value pairs to insert in jsonb column of vpsurvey_amphib
        var macroRow = {}; //array of objects of colum:value pairs to insert in jsonb column of vpsurvey_macro
        var yearRow = {}; //single object of colum:value pairs to insert in jsonb column of vpsurvey_year
        var photoRow = {}; //single object of colum:value pairs to insert in jsonb column of vpsurvey_photos
        var colum = null;
        var split = [];
        var obsId = 1; //obsId is 1-based for actual observers
        var value = null; //temporary local var to hold values for scrubbing
        Object.keys(jsonArr[i]).forEach(colum => { //iterate over keys in jsonData object (column names)
          split = colum.split(obsDelim); colum = split[split.length-1]; //observer column_name is the last piece
          obsId = (2==split.length?split[0]:0); //did we get two array-elements split by '_'? If yes, flag it.
          obsId = (obsId?obsId.slice(-1):0); //if flagged above, obsId is the trailing number of 'obs2...'
          if (obsId && !amphibRow[obsId]) {amphibRow[obsId] = {};} //initialize valid amphibRow array element
          value = jsonArr[i][colum];
          if ('' === value) {value = null;} //convert empty strings to null
          if (`${Number(value)}` === value) {value = Number(value);} //convert string number to numbers (MUST USE '===' or it converts bool to int!!!)
          if (tableColumns['vpsurvey'].includes(colum)) {surveyRow[colum]=value;}
          if (tableColumns['vpsurvey_photos'].includes(colum)) {photoRow[colum]=value;}
          if (tableColumns['vpsurvey_year'].includes(colum)) {yearRow[colum]=value;}
          if (tableColumns['vpsurvey_macro'].includes(colum)) {macroRow[colum]=value;}
          if (tableColumns['vpsurvey_amphib'].includes(colum)) {amphibRow[obsId][colum]=value;}
          if ('surveyUserEmail'==colum && value===null) surveyRow[colum]=req.query.surveyUserEmail;
        });
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
      //console.log('vpsurvey.s123.service::upsert | columns', columns);
      //console.log('vpsurvey.s123.service::upsert | values', valArr);
    } catch (err) {
      console.log('vpsurvey.s123.service::upsert | try-catch ERROR', err.message);
      reject(err);
    }
    db.pgpDb.many(query) //'many' for expected return values
      .then(res => {
        console.log('vpsurvey.s123.service::upsert-pgpDb | SUCCESS', res);
        resolve(res);
      })
      .catch(err => {
        console.log('vpsurvey.s123.service::upsert-pgpDb | ERROR', err.message);
        reject(err);
      }); //end pgpDb
  });//end promise
}
