const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
const fetch = require('node-fetch');
const vpS123Util = require('vpUtil/vpS123.service');
const moment = require('moment');
var staticColumns = []; //all tables' columns in a single 1D array
var tableColumns = []; //each table's columns by table name

const defaultServiceId = 'service_71386df693ec4db8868d7a7c64c50761'; //default VPVisit serviceId
//service_71386df693ec4db8868d7a7c64c50761
const defaultFeatureId = 0;
const attachFeatureIds = [1,2,3,4,5,6,7,8];

module.exports = {
    getData,
    getUpsertData,
    getAttachments,
    getUpsertAttachments,
    getUpsertAll
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

function getData(req) {
  return new Promise((resolve, reject) => {
    if (!req.query.serviceId) {req.query.serviceId = 'defaultServiceId';}
    vpS123Util.getData(req.query)
      .then(jsonData => {
        console.log('vpVisit.s123.service::getData | SUCCESS', jsonData);
        resolve(jsonData);
      })
      .catch(err => {
        console.log('vpVisit.s123.service::getData | ERROR', err.message);
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
          console.log('vpVisit.s123.service::getupsertAll | SUCCESS', res);
          resolve(res);
        })
        .catch(err => {
          console.log('vpVisit.s123.service::getupsertAll | ERROR', err);
          reject(err);
        });
    }
  });
}

function getUpsertData(req) {
  return new Promise((resolve, reject) => {
    if (!req.query.serviceId) {req.query.serviceId = 'defaultServiceId';}
    vpS123Util.getData(req.query)
      .then(jsonData => {
        upsert(req, [jsonData]) //put a single json Data object into array for future multi-object upsert
          .then(res => {resolve(res);})
          .catch(err => {reject(err);})
      })
      .catch(err => {
        console.log('vpVisit.s123.service::getUpsertData | ERROR', err.message);
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
      query += ' RETURNING "visitId", "visitPoolId", "visitGlobalId", "createdAt"!="updatedAt" AS updated ';
      //console.log('vpVisit.s123.service::upsert | query', query); //verbatim query with values for testing
      //console.log('vpVisit.s123.service::upsert | columns', columns);
      //console.log('vpVisit.s123.service::upsert | values', valArr);
    } catch (err) {
      console.log('vpVisit.s123.service::upsert | try-catch ERROR', err.message);
      reject(err);
    }
    db.pgpDb.many(query) //'many' for expected return values
      .then(res_data => {
//        console.log('vpVisit.s123.service::upsert | pgpDb SUCCESS', res);
//        resolve(res);
        //to-do: create a for loop to handle multiple visit inserts
        req.query.visitId = res_data[0].visitId;
        req.query.globalId = res_data[0].visitGlobalId;
        delete req.query.objectId; //This was the objectId of the parent. Remove it so it uses globalId to find attachments.
        getUpsertAttachments(req)
          .then(res_atch => {
            console.log('getUpdateAttachments AFTER getUpsertData | DOUBLE SUCCESS:', [res_data[0], res_atch]);
            resolve([res_data[0], res_atch]);
          })
          .catch(err_atch => {
            console.log('getUpdateAttachments AFTER getUpsertData | MIXED RESULTS:', [res_data[0], err_atch]);
            resolve([res_data[0], err_atch]);
          })
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
      jsonArr[i]["visitSpeciesComments"]=jsonArr[i]["visitMiscNotes"];
      jsonArr[i]["visitFish"]=jsonArr[i]["visitFish"];
      jsonArr[i]["visitFishCount"]=jsonArr[i]["visitFishCount"];
      jsonArr[i]["visitFishSize"]=jsonArr[i]["FishSize"];
      jsonArr[i]["visitFishSizeSmall"]=jsonArr[i]["visitFishSizeSmall"];
      jsonArr[i]["visitFishSizeMedium"]=jsonArr[i]["visitFishSizeMedium"];
      jsonArr[i]["visitFishSizeLarge"]=jsonArr[i]["visitFishSizeLarge"];
    }
    return jsonArr;
}

/*
https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services/service_71386df693ec4db8868d7a7c64c50761/
FeatureServer/[1,2,3,4,5,6,7,8]/
queryAttachments
?objectIds=1&globalIds=&returnUrl=true&f=pjson

To get attachments for a VPVisit
- get the globalId from the parent Visit
- call this function with these query values:
  - featureId == 1-N [1, 2, 3, ...7] for VPSurvey, [1, 2, 3, ...8] for VPVisit
  - globalId == parentGlobalId

You must call this function N times, once for each separate featureId, to query
0-i attachments for each featureId.
*/
function getAttachments(req) {
  return new Promise((resolve, reject) => {
    if (!req.query.serviceId) {req.query.serviceId = defaultServiceId;}
    if (!req.query.featureId) {req.query.featureId = defaultFeatureId;}
    vpS123Util.getAttachments(req.query)
      .then(jsonArr => {
        console.log('vpVisit.s123.service::getAttachments | SUCCESS', jsonArr);
        resolve(jsonArr);
      })
      .catch(err => {
        console.log('vpVisit.s123.service::getAttachments | ERROR', err.message);
        reject(err);
      });
    });
}

function getUpsertAttachments(req) {
  return new Promise((resolve, reject) => {
    if (!req.query.globalId && !req.query.visitId) {
      reject({message:`visitId and visitGlobalId missing. Cannot upsert attachments without at least one.`});
    };
    getVisitIdFromGlobalId(req.query)
      .then(visitId => {
        req.query.visitId = visitId;
        if (!req.query.serviceId) {req.query.serviceId = 'defaultServiceId';}
        vpS123Util.getAttachments(req.query)
          .then(jsonParents => {
            console.log('vpVisit.s123.service::getUpsertAttachments | SUCCESS', jsonParents);
            upsertAttachments(req, jsonParents)
              .then(res => {resolve(res);})
              .catch(err => {reject(err);})
          })
          .catch(err => {
            console.log('vpVisit.s123.service::getUpsertS123Attachments | ERROR', err.message);
            reject(err);
          });
      })
      .catch(err => {
        reject({message:`No parent visit in database. Cannot upsert attachments for parent globalId ${req.query.globalId}`});
      })
    }); //end promise
}

function getVisitIdFromGlobalId(qry) {
  return new Promise((resolve, reject) => {
    if (qry.visitId > 0) {
      console.log('getVisitIdFromGlobalId | INPUT visitId:', qry.visitId);
      resolve(qry.visitId);
    } else {
      query(`SELECT "visitId" FROM vpvisit WHERE "visitGlobalId"=$1`, [qry.globalId])
        .then(res => {
          const id = res.rowCount?res.rows[0].visitId:0;
          console.log('getVisitIdFromGlobalId | INPUT globalId:', qry.globalId, ' | RESULT:', res.rowCount?res.rows[0].visitId:0);
          if (id) {resolve(id);}
          else {reject(0);}
        })
        .catch(err => {
          console.log('getVisitIdFromGlobalId | ERROR:', err.message);
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
function updateAttachments(req, jsonParents) {
  return new Promise((resolve, reject) => {
    if (!req.query.visitId) {reject({message:'visitId required to Upsert attachments.'})}
    try {
      const jsonParent = jsonParents[0]; //kluge for now. to-do: add looping logic to insert many vists' photos
      const jsonArr = jsonParent.attachmentInfos;
      const typeArr = ['WOFR','SPSA','JESA','BLSA','FASH','CDFY','CLAM','OTHER','POOL'];
      var valArr = [];
      console.log('updateAttachments | jsonArr', jsonArr);
      for (i=0; i<jsonArr.length; i++) { //iterate over jsonData objects in jsonArray
        var photoRow = {}; //single object of colum:value pairs for one insert row into vpvisit_photos
        photoRow['visitId']=req.query.visitId;
        var type = 'UNKNOWN';
        var keyw = jsonArr[i].keywords.toUpperCase();
        for (j=0; j<typeArr.length; j++) {
          type = keyw.includes(typeArr[j])?typeArr[j]:'UNKNOWN';
        }
        switch(type) {
          case 'POOL':
            photoRow['visitPoolPhoto']=jsonArr[i].url;
            break;
          case 'WOFR':
            photoRow['visitWoodFrogPhoto']=jsonArr[i].url;
            break;
          case 'SPSA':
            photoRow['visitSpsPhoto']=jsonArr[i].url;
            break;
          case 'JESA':
            photoRow['visitJesaPhoto']=jsonArr[i].url;
            break;
          case 'BLSA':
            photoRow['visitBssaPhoto']=jsonArr[i].url;
            break;
          case 'FASH':
            photoRow['visitFairyShrimpPhoto']=jsonArr[i].url;
            break;
          case 'CLAM':
            photoRow['visitFingerNailClamsPhoto']=jsonArr[i].url;
            break;
          case 'OTHER':
          case 'UNKNOWN':
            photoRow['visitSpeciesOtherPhoto']=jsonArr[i].url;
            break;
        }
        valArr.push(photoRow);
      }
      var columns = [];
      var query = null;
      var photoColumns = tableColumns['vpvisit']; //make a copy so it can be altered in case of UPDATE, below.
      //https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise
      columns = new db.pgp.helpers.ColumnSet(photoColumns, {table: 'vpvisit'});
      query = db.pgp.helpers.update(valArr, columns);
      query += ' RETURNING "visitId", ';
      console.log('vpVisit.s123.service::updateAttachments | query', query); //verbatim query with values for testing
      //console.log('vpVisit.s123.service::updateAttachments | columns', columns);
      //console.log('vpVisit.s123.service::updateAttachments | values', valArr);
      db.pgpDb.many(query) //'many' for expected return values
        .then(res => {
          console.log('vpVisit.s123.service::updateAttachments | pgpDb SUCCESS', res);
          resolve(res);
        })
        .catch(err => {
          console.log('vpVisit.s123.service::upsert | pgpDb ERROR', err.message);
          reject(err);
        }); //end pgpDb
    } catch (err) {
      console.log('vpVisit.s123.service::updateAttachments | try-catch ERROR', err.message);
      reject(err);
    }
  }); //end Promise
}
