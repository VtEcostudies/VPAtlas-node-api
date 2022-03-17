const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
const fetch = require('node-fetch');
const moment = require('moment');
var staticColumns = []; //all tables' columns in a single 1D array
var tableColumns = []; //each table's columns by table name

module.exports = {
    getS123Data,
    getUpsertS123Data
};

//file scope list of vpvisit table columns retrieved on app startup (see 'getColumns()' below)
const tables = [
  "vpvisit",
  "vptown"
];
for (i=0; i<tables.length; i++) {
  pgUtil.getColumns(tables[i], staticColumns) //run it once on init: to create the array here. also diplays on console.
    .then(res => {
      tableColumns[res.tableName] = res.tableColumns;
      return res;
    })
    .catch(err => {console.log(`vpVisit.service.pg.pgUtil.getColumns | table:${tables[i]} | error: `, err.message);});
}

/*
https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services/
service_71386df693ec4db8868d7a7c64c50761
/FeatureServer/
0/1
?f=pjson
*/
function getS123Data(req) {
  const apiUrl = 'https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services';
  const srvId = 'service_71386df693ec4db8868d7a7c64c50761';
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
          console.log('vpVisit.s123.service::getS123Data | ERROR', json);
          reject(json.error);
        } else {
          console.log('vpVisit.s123.service::getS123Data | SUCCESS', json.feature.attributes);
          resolve(json.feature.attributes);
        }
      })
      .catch(err => {
        console.log('vpVisit.s123.service::getS123Data | ERROR', err.message);
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
      var colum = null;
      var visitColumns = [];
      jsonArr = fixJsonColumnsData(jsonArr);
      Object.keys(jsonArr[0]).forEach(colum => {
        if (tableColumns['vpvisit'].includes(colum)) visitColumns.push(colum);
      });
      //console.log('vpvisit header', visitColumns);
      var valArr = [];
      for (i=0; i<jsonArr.length; i++) { //iterate over jsonData objects in jsonArray
        var visitRow = {}; //single object of colum:value pairs for one insert row into vpVisit
        var value = null; //temporary local var to hold values for scrubbing
        Object.keys(jsonArr[i]).forEach(colum => { //iterate over keys in jsonData object (column names)
          value = jsonArr[i][colum];
          if ('' === value) {value = null;} //convert empty strings to null
          if (`${Number(value)}` === value) {value = Number(value);} //convert string number to numbers (MUST USE '===' or it converts bool to int!!!)
          if (tableColumns['vpvisit'].includes(colum)) {visitRow[colum]=value;}
        });
        valArr.push(visitRow);
      }
      var columns = [];
      var query = null;
      //https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise
      columns = new db.pgp.helpers.ColumnSet(visitColumns, {table: 'vpvisit'});
      query = db.pgp.helpers.insert(valArr, columns);
      if (update) {
        query += `
        ON CONFLICT ON CONSTRAINT "vpVisit_unique_visitPoolId_visitDate_visitUserName"
        DO UPDATE SET ("${visitColumns.join('","')}")=(EXCLUDED."${visitColumns.join('",EXCLUDED."')}")`;
      }
      query += ' RETURNING "visitId", "visitPoolId", "createdAt"!="updatedAt" AS updated ';
      //console.log('vpVisit.s123.service::upsert | query', query); //verbatim query with values for testing
      //console.log('vpVisit.s123.service::upsert | columns', columns);
      //console.log('vpVisit.s123.service::upsert | values', valArr);
    } catch (err) {
      console.log('vpVisit.s123.service::upsert | try-catch ERROR', err.message);
      reject(err);
    }
    db.pgpDb.many(query) //'many' for expected return values
      .then(res => {
        console.log('vpVisit.s123.service::upsert | pgpDb SUCCESS', res);
        resolve(res);
      })
      .catch(err => {
        console.log('vpVisit.s123.service::upsert | pgpDb ERROR', err.message);
        reject(err);
      }); //end pgpDb
  }); //end Promise
}

function fixJsonColumnsData(jsonArr) {
  for (i=0; i<jsonArr.length; i++) { //iterate over jsonData objects in jsonArray
      jsonArr[i]["visitGlobalId"]=jsonArr[i]["globalid"];
      jsonArr[i]["visitPoolId"]=jsonArr[i]["visitPoolId"];
      jsonArr[i]["visitUserName"]=jsonArr[i]["visitUsername"];
      jsonArr[i]["visitObserverUserName"]=jsonArr[i]["visitUsername"];
      jsonArr[i]["visitLongitude"]=jsonArr[i]["longitude"];
      jsonArr[i]["visitLatitude"]=jsonArr[i]["latitude"];
      jsonArr[i]["visitDate"]=moment(jsonArr[i]["visitDateFormat"]).format("YYYY-MM-DD");
      jsonArr[i]["visitLocatePool"]=jsonArr[i]["visitlocated"];
      jsonArr[i]["visitCertainty"]=jsonArr[i]["visitCertainty"];
      jsonArr[i]["visitNavMethod"]=jsonArr[i]["visitNavMethod"];
      jsonArr[i]["visitNavMethodOther"]=jsonArr[i]["visitNavMethod_other"];
      jsonArr[i]["visitDirections"]=jsonArr[i]["visitdirections"];
      jsonArr[i]["visitLocationComments"]=jsonArr[i]["visitComments"];
      //jsonArr[i]["visitPoolMapped"]=jsonArr[i]["visitmapped"];
      jsonArr[i]["visitVernalPool"]=jsonArr[i]["visitVernalPool"];
      jsonArr[i]["visitPoolType"]=jsonArr[i]["visitPoolType"];
      jsonArr[i]["visitPoolTypeOther"]=jsonArr[i]["visitPoolType_other"];
      jsonArr[i]["visitInletType"]=jsonArr[i]["visitInletType"];
      jsonArr[i]["visitOutletType"]=jsonArr[i]["visitOutletType"];
      jsonArr[i]["visitForestUpland"]=jsonArr[i]["visitForestUpland"];
      jsonArr[i]["visitForestCondition"]=jsonArr[i]["visitForestCondition"];
      jsonArr[i]["visitHabitatAgriculture"]=Boolean(jsonArr[i]["visitHabAgriculture"]);
      jsonArr[i]["visitHabitatLightDev"]=Boolean(jsonArr[i]["visitHabitatLightDev"]);
      jsonArr[i]["visitHabitatHeavyDev"]=Boolean(jsonArr[i]["visitHabitatHeavyDev"]);
      jsonArr[i]["visitHabitatPavedRd"]=Boolean(jsonArr[i]["visitHabitatPavedRd"]);
      jsonArr[i]["visitHabitatDirtRd"]=Boolean(jsonArr[i]["visitHabitatDirtRd"]);
      jsonArr[i]["visitHabitatPowerline"]=Boolean(jsonArr[i]["visitHabitatPowerline"]);
      jsonArr[i]["visitHabitatOther"]=jsonArr[i]["visitHabitatOther"];
      jsonArr[i]["visitMaxDepth"]=jsonArr[i]["visitMaxDepth"];
      jsonArr[i]["visitWaterLevelObs"]=jsonArr[i]["visitWaterLevelObs"];
      jsonArr[i]["visitMaxWidth"]=jsonArr[i]["visitMaxWidth"];
      jsonArr[i]["visitMaxLength"]=jsonArr[i]["visitMaxLength"];
      jsonArr[i]["visitPoolTrees"]=jsonArr[i]["visitPoolTrees"];
      jsonArr[i]["visitPoolShrubs"]=jsonArr[i]["visitPoolShrubs"];
      jsonArr[i]["visitPoolEmergents"]=jsonArr[i]["visitPoolEmergents"];
      jsonArr[i]["visitPoolFloatingVeg"]=jsonArr[i]["visitPoolFloatingVeg"];
      jsonArr[i]["visitSubstrate"]=jsonArr[i]["visitSubstrate"];
      jsonArr[i]["visitSubstrateOther"]=jsonArr[i]["visitSubstrate_other"];
      jsonArr[i]["visitDisturbDumping"]=Boolean(jsonArr[i]["visitDisturbDumping"]);
      jsonArr[i]["visitDisturbSiltation"]=Boolean(jsonArr[i]["visitDisturbSiltation"]);
      jsonArr[i]["visitDisturbVehicleRuts"]=Boolean(jsonArr[i]["visitDisturbVehicleRuts"]);
      jsonArr[i]["visitDisturbRunoff"]=Boolean(jsonArr[i]["visitDisturbRunoff"]);
      jsonArr[i]["visitDisturbDitching"]=Boolean(jsonArr[i]["visitDisturbDitching"]);
      jsonArr[i]["visitDisturbOther"]=jsonArr[i]["visitDisturbOther"];
      jsonArr[i]["visitWoodFrogAdults"]=jsonArr[i]["visitWoodFrogAdults"];
      jsonArr[i]["visitWoodFrogLarvae"]=jsonArr[i]["visitWoodFrogLarvae"];
      jsonArr[i]["visitWoodFrogEgg"]=jsonArr[i]["visitWoodFrogEgg"];
      jsonArr[i]["visitWoodFrogEggHow"]=jsonArr[i]["visitWoodFrogEggHow"];
      jsonArr[i]["visitSpsAdults"]=jsonArr[i]["visitSpsAdults"];
      jsonArr[i]["visitSpsLarvae"]=jsonArr[i]["visitSpsLarvae"];
      jsonArr[i]["visitSpsEgg"]=jsonArr[i]["visitSpsEgg"];
      jsonArr[i]["visitSpsEggHow"]=jsonArr[i]["visitSpsEggHow"];
      jsonArr[i]["visitJesaAdults"]=jsonArr[i]["visitJesaAdults"];
      jsonArr[i]["visitJesaLarvae"]=jsonArr[i]["visitJesaLarvae"];
      jsonArr[i]["visitJesaEgg"]=jsonArr[i]["visitJesaEgg"];
      jsonArr[i]["visitJesaEggHow"]=jsonArr[i]["visitJesaEggHow"];
      jsonArr[i]["visitBssaAdults"]=jsonArr[i]["visitBssaAdults"];
      jsonArr[i]["visitBssaLarvae"]=jsonArr[i]["visitBssaLarvae"];
      jsonArr[i]["visitBssaEgg"]=jsonArr[i]["visitBssaEgg"];
      jsonArr[i]["visitBssaEggHow"]=jsonArr[i]["visitBssaEggHow"];
      jsonArr[i]["visitFairyShrimp"]=jsonArr[i]["visitFairyShrimp"];
      jsonArr[i]["visitFingerNailClams"]=jsonArr[i]["visitFingernailClam"];
      jsonArr[i]["visitSpeciesOther1"]=jsonArr[i]["visitOther"];
      jsonArr[i]["visitSpeciesComments"]=jsonArr[i]["surveyMiscNotes"];
      jsonArr[i]["visitFish"]=jsonArr[i]["visitFish"];
      jsonArr[i]["visitFishCount"]=jsonArr[i]["visitFishCount"];
      jsonArr[i]["visitFishSize"]=jsonArr[i]["FishSize"];
      jsonArr[i]["visitFishSizeSmall"]=jsonArr[i]["visitFishSizeSmall"];
      jsonArr[i]["visitFishSizeMedium"]=jsonArr[i]["visitFishSizeMedium"];
      jsonArr[i]["visitFishSizeLarge"]=jsonArr[i]["visitFishSizeLarge"];
    }
    return jsonArr;
}
