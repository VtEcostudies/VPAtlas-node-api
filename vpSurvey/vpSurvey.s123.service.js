const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
const fetch = require('node-fetch')
const vpS123Util = require('vpUtil/vpS123.service');
var staticColumns = []; //all tables' columns in a single 1D array
var tableColumns = []; //each table's columns by table name

module.exports = {
    getData,
    getUpsertData,
    getAttachments,
    getUpsertAttachments,
    getUpsertAll
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

function getData(req) {
  return new Promise((resolve, reject) => {
    if (!req.query.serviceId) {req.query.serviceId = 'service_fae86d23c46e403aa0dae67596be6073';}
    vpS123Util.getData(req.query)
      .then(jsonData => {
        console.log('vpSurvey.s123.service::getData | SUCCESS', jsonData);
        resolve(jsonData);
      })
      .catch(err => {
        console.log('vpSurvey.s123.service::getData | ERROR', err.message);
        reject(err);
      });
    });
}

function getUpsertAll(req) {
  return new Promise((resolve, reject) => {
    var first = req.query.first?req.query.first:1;
    var last = req.query.last?req.query.last:10;
    for (i=first; i<last; i++) {
      req.query.objectId = i;
      getUpsertData(req)
        .then(res => {
          console.log('getupsertAll | SUCCESS', res);
          resolve(res);
        })
        .catch(err => {
          console.log('getupsertAll | ERROR', err);
          reject(err);
        });
    }
  });
}

function getUpsertData(req) {
  return new Promise((resolve, reject) => {
    if (!req.query.serviceId) {req.query.serviceId = 'service_fae86d23c46e403aa0dae67596be6073';}
    vpS123Util.getData(req.query)
      .then(jsonData => {
        upsert(req, [jsonData]) //put a single json Data object into array for future multi-object upsert
          .then(res => {resolve(res);})
          .catch(err => {reject(err);})
      })
      .catch(err => {
        console.log('vpSurvey.s123.service::getUpsertData | ERROR', err.message);
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
      surveyColumns.push('surveyGlobalId'); //sent as simply 'globalId'
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
        jsonArr[i]['surveyGlobalId'] = jsonArr[i].globalid; //map this custom value always
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
          if ('surveyTypeId'==colum && value===5) surveyRow[colum]=9; //map their 5 to our 9
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
      query += ' RETURNING "surveyId", "surveyPoolId", "surveyGlobalId", "createdAt"!="updatedAt" AS updated ';
      console.log('vpsurvey.upload | query', query); //verbatim query with values for testing
      //console.log('vpsurvey.s123.service::upsert | columns', columns);
      //console.log('vpsurvey.s123.service::upsert | values', valArr);
    } catch (err) {
      console.log('vpsurvey.s123.service::upsert | try-catch ERROR', err.message);
      reject(err);
    }
    db.pgpDb.many(query) //'many' for expected return values
      .then(res_data => { //pgpDB.many return an array of results
        console.log('vpsurvey.s123.service::upsert-pgpDb | SUCCESS:', res_data);
        //to-do: create a for loop to handle multiple survey inserts
        req.query.surveyId = res_data[0].surveyId;
        req.query.globalId = res_data[0].surveyGlobalId;
        delete req.query.objectId; //This was the objectId of the parent. Remove it so it uses globalId to find attachments.
        getUpsertAttachments(req)
          .then(res_atch => {
            console.log('getUpsertAttachments AFTER getUpsertData | DOUBLE SUCCESS:', [res_data[0], res_atch]);
            resolve([res_data[0], res_atch]);
          })
          .catch(err_atch => {
            console.log('getUpsertAttachments AFTER getUpsertData | MIXED RESULTS:', [res_data[0], err_atch]);
            resolve([res_data[0], err_atch]);
          })
      })
      .catch(err => {
        console.log('vpsurvey.s123.service::upsert-pgpDb | ERROR', err.message);
        reject(err);
      }); //end pgpDb
  }); //end promise
}

function getAttachments(req) {
  return new Promise((resolve, reject) => {
    if (!req.query.serviceId) {req.query.serviceId = 'service_fae86d23c46e403aa0dae67596be6073';}
    vpS123Util.getAttachments(req.query)
      .then(jsonArr => {
        console.log('vpSurvey.s123.service::getAttachments | SUCCESS', jsonArr);
        resolve(jsonArr);
      })
      .catch(err => {
        console.log('vpSurvey.s123.service::getAttachments | ERROR', err.message);
        reject(err);
      });
    });
}

function getUpsertAttachments(req) {
  return new Promise((resolve, reject) => {
    if (!req.query.globalId && !req.query.surveyId) {
      reject({message:`surveyId and globalId missing. Cannot upsert attachments without at least one.`});
    };
    getSurveyIdFromGlobalId(req.query)
      .then(surveyId => {
        req.query.surveyId = surveyId;
        if (!req.query.serviceId) {req.query.serviceId = 'service_fae86d23c46e403aa0dae67596be6073';}
        vpS123Util.getAttachments(req.query)
          .then(jsonParents => {
            console.log('vpSurvey.s123.service::getUpsertAttachments | SUCCESS', jsonParents);
            upsertAttachments(req, jsonParents)
              .then(res => {resolve(res);})
              .catch(err => {reject(err);})
          })
          .catch(err => {
            console.log('vpSurvey.s123.service::getUpsertAttachments | ERROR', err.message);
            reject(err);
          });
      })
      .catch(err => {
        reject({message:`No parent survey in database. Cannot upsert attachments for parent globalId ${req.query.globalId}`});
      })
    }); //end promise
}

function getSurveyIdFromGlobalId(qry) {
  return new Promise((resolve, reject) => {
    if (qry.surveyId > 0) {
      console.log('getSurveyIdFromGlobalId | INPUT surveyId:', qry.surveyId);
      resolve(qry.surveyId);
    } else {
      query(`SELECT "surveyId" FROM vpsurvey WHERE "surveyGlobalId"=$1`, [qry.globalId])
        .then(res => {
          const id = res.rowCount?res.rows[0].surveyId:0;
          console.log('getSurveyIdFromGlobalId | INPUT globalId:', qry.globalId, ' | RESULT:', res.rowCount?res.rows[0].surveyId:0);
          if (id) {resolve(id);}
          else {reject(0);}
        })
        .catch(err => {
          console.log('getSurveyIdFromGlobalId | ERROR:', err.message);
          resolve(0);
       });
     } //end else
   }); //end promise
}

/*
  Inserting photos from S123 API... Hm. For a given parentGlobalId, there may be
  0 to N attachments, listed like this as attachmentInfos:
  {
       "parentObjectId": 307,
       "parentGlobalId": "f85228e0-900d-40c7-96fd-8884b99c25d2",
       "attachmentInfos": [
           {
               "id": 11,
               "globalId": "3f601700-70ff-4f4e-8825-0fbe4cdab7c8",
               "name": "visitPoolPhoto-20220305-151134.jpg",
               "contentType": "image/jpeg",
               "size": 170802,
               "keywords": "visitPoolPhoto",
               "url": "https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services/service_fae86d23c46e403aa0dae67596be6073/FeatureServer/0/307/attachments/11",
               "exifInfo": null
           }
       ]
   }
*/
function upsertAttachments(req, jsonParents) {
  var update = 0;
  return new Promise((resolve, reject) => {
    if (!req.query.surveyId) {reject({message:'surveyId required to Upsert attachments.'})}
    try {
      if (req.query) {update = !!req.query.update;}
      const jsonParent = jsonParents[0];
      //jsonParent.surveyId=req.query.surveyId;
      const jsonArr = jsonParent.attachmentInfos;
      const typeArr = ['WOFR','SPSA','JESA','BLSA','FASH','CDFY','POOL'];
      var valArr = [];
      console.log('upsertAttachments | jsonArr', jsonArr);
      for (i=0; i<jsonArr.length; i++) { //iterate over jsonData objects in jsonArray
        var photoRow = {}; //single object of colum:value pairs for one insert row into vpsurvey_photos
        photoRow['surveyPhotoSurveyId']=req.query.surveyId;
        photoRow['surveyPhotoUrl']=jsonArr[i].url;
        photoRow['surveyPhotoName']=jsonArr[i].name;
        var type = 'UNKNOWN';
        var keyw = jsonArr[i].keywords.toUpperCase();
        for (j=0; j<typeArr.length; j++) {
          type = keyw.includes(typeArr[j])?typeArr[j]:'UNKNOWN';
        }
        photoRow['surveyPhotoSpecies']=type;
        valArr.push(photoRow);
      }
      var columns = [];
      var query = null;
      var photoColumns = tableColumns['vpsurvey_photos']; //make a copy so it can be altered in case of UPDATE, below.
      //https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise
      columns = new db.pgp.helpers.ColumnSet(photoColumns, {table: 'vpsurvey_photos'});
      query = db.pgp.helpers.insert(valArr, columns);
      if (update) {
        query += `
        ON CONFLICT ON CONSTRAINT "vpsurvey_photos_unique_surveyId_species_url"
        DO UPDATE SET ("${photoColumns.join('","')}")=(EXCLUDED."${photoColumns.join('",EXCLUDED."')}")`;
      }
      query += ' RETURNING *';
      console.log('vpSurvey.s123.service::upsertAttachments | query', query); //verbatim query with values for testing
      //console.log('vpSurvey.s123.service::upsertAttachments | columns', columns);
      //console.log('vpSurvey.s123.service::upsertAttachments | values', valArr);
      db.pgpDb.many(query) //'many' for expected return values
        .then(res => {
          console.log('vpSurvey.s123.service::upsertAttachments | pgpDb SUCCESS', res);
          resolve(res);
        })
        .catch(err => {
          console.log('vpSurvey.s123.service::upsert | pgpDb ERROR', err.message);
          reject(err);
        }); //end pgpDb
    } catch (err) {
      console.log('vpSurvey.s123.service::upsertAttachments | try-catch ERROR', err.message);
      reject(err);
    }
  }); //end Promise
}
