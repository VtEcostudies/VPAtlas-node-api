const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
const fetch = require('node-fetch');
const vpS123Util = require('vpUtil/vpS123.service');
const moment = require('moment');
var staticColumns = []; //all tables' columns in a single 1D array
var tableColumns = []; //each table's columns by table name

const defaultServiceId = 'service_71386df693ec4db8868d7a7c64c50761'; //default VPVisit serviceId
//original VPVisit DataSheet serviceId: service_71386df693ec4db8868d7a7c64c50761
const defaultFeatureId = 0;
const attachFeatureIds = {1:'WOFR',2:'SPSA',3:'JESA',4:'BSSA',5:'FASH',6:'FNC',7:'OTHER',8:'POOL'};

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
  "vpvisit_photos",
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
    if (!req.query.serviceId) {req.query.serviceId = defaultServiceId;}
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
    if (!req.query.serviceId) {req.query.serviceId = defaultServiceId;}
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

/*
 INSERT or UPDATE VPVisit data from S123 VPVisit Data Sheet

*/
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
        if (!jsonArr[i].visitPoolId && !jsonArr[i].visitPoolMapped) {jsonArr[i].visitPoolId='NEW*';}
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
      query += ' RETURNING "visitId","visitPoolId","visitGlobalId","visitObjectId","createdAt"!="updatedAt" AS updated ';
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
        req.query.globalId = res_data[0].visitGlobalId; //This is not needed to find repeatTable attachments.
        req.query.objectId = res_data[0].visitObjectId; //This is the objectId of the parent visit. Use it to find repeatTable attachments.
        getUpsertAttachments(req)
          .then(res_atch => {
            console.log('getUpsertAttachments AFTER getUpsertData | DOUBLE SUCCESS:', {data:res_data[0],attachments:res_atch});
            resolve({data:res_data[0],attachments:res_atch});
          })
          .catch(err_atch => {
            console.log('getUpsertAttachments AFTER getUpsertData | MIXED RESULTS:', {data:res_data[0],attachments:err_atch});
            resolve({data:res_data[0],attachments:err_atch});
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
      jsonArr[i]["visitObjectId"]=jsonArr[i]["objectid"];
      jsonArr[i]["visitPoolId"]=jsonArr[i]["visitPoolId"];
      jsonArr[i]["visitUserName"]=jsonArr[i]["visitUsername"];
      jsonArr[i]["visitObserverUserName"]=jsonArr[i]["visitObserverUserName"]?jsonArr[i]["visitObserverUserName"]:jsonArr[i]["visitUsername"];
      jsonArr[i]["visitLongitude"]=jsonArr[i]["longitude"];
      jsonArr[i]["visitLatitude"]=jsonArr[i]["latitude"];
      jsonArr[i]["visitDate"]=moment(jsonArr[i]["visitDateFormat"]).format("YYYY-MM-DD");
      jsonArr[i]["visitPoolMapped"]=jsonArr[i]["visitmapped"].includes('unmapped')?false:true; //custom field not in db to catch NEW* pools
      jsonArr[i]["visitLocatePool"]=jsonArr[i]["visitlocated"];
      jsonArr[i]["visitCertainty"]=jsonArr[i]["visitCertainty"];
      jsonArr[i]["visitNavMethod"]=jsonArr[i]["visitNavMethod"];
      jsonArr[i]["visitNavMethodOther"]=jsonArr[i]["visitNavMethod_other"];
      jsonArr[i]["visitDirections"]=jsonArr[i]["visitdirections"];
      jsonArr[i]["visitLocationComments"]=jsonArr[i]["visitComments"];
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
    vpS123Util.getRepeatAttachments(req.query)
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
    if (!req.query.objectId && !req.query.globalId && !req.query.visitId) {
      reject({message:`visitId and vistitObjectId and visitGlobalId missing. Cannot upsert attachments without at least one.`});
    };
    getVisitIdFromS123Id(req.query)
      .then(visitId => {
        req.query.visitId = visitId;
        if (!req.query.serviceId) {req.query.serviceId = defaultServiceId;}
        vpS123Util.getRepeatAttachments(req.query)
          .then(jsonParent => { //getRepeatAttachments now retruns an array of results within a parent object
            console.log('vpVisit.s123.service::getUpsertAttachments | SUCCESS', jsonParent);
            upsertAttachments(req, jsonParent)
              .then(res => {resolve(res);})
              .catch(err => {reject(err);})
          })
          .catch(err => {
            console.log('vpVisit.s123.service::getUpsertS123Attachments | ERROR', err.message);
            reject(err);
          });
      })
      .catch(err => {
        reject({message:`No parent visit in database. Cannot upsert attachments for parent objectId ${req.query.objectId} or globalId ${req.query.globalId}`});
      })
    }); //end promise
}

function getVisitIdFromS123Id(qry) {
  return new Promise((resolve, reject) => {
    if (qry.visitId > 0) {
      console.log('getVisitIdFromS123Id | INPUT visitId:', qry.visitId);
      resolve(qry.visitId);
    } else if (qry.objectId) {
      query(`SELECT "visitId" FROM vpvisit WHERE "visitObjectId"=$1`, [qry.objectId])
        .then(res => {
          const id = res.rowCount?res.rows[0].visitId:0;
          console.log('getVisitIdFromS123Id | INPUT objectId:', qry.objectId, ' | RESULT:', res.rowCount?res.rows[0].visitId:0);
          if (id) {resolve(id);}
          else {reject(0);}
        })
        .catch(err => {
          console.log('getVisitIdFromS123Id | ERROR:', err.message);
          resolve(0);
       });
    } else if (qry.globalId) {
      query(`SELECT "visitId" FROM vpvisit WHERE "visitGlobalId"=$1`, [qry.globalId])
        .then(res => {
          const id = res.rowCount?res.rows[0].visitId:0;
          console.log('getVisitIdFromS123Id | INPUT globalId:', qry.globalId, ' | RESULT:', res.rowCount?res.rows[0].visitId:0);
          if (id) {resolve(id);}
          else {reject(0);}
        })
        .catch(err => {
          console.log('getVisitIdFromS123Id | ERROR:', err.message);
          resolve(0);
       });
     } else {
       console.log('getVisitIdFromS123Id | ERROR: visitId, objectId, or globalId not found in request object.');
       reject(0);
     }//end else
   }); //end promise
}

/*
  Inserting one photo from S123 feature API like this:
  https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services/service_71386df693ec4db8868d7a7c64c50761/FeatureServer/8/5/attachments?f=pjson
  {
    "attachmentInfos" : [
      {
        "id" : 5,
        "globalId" : "660111a9-7f53-4e61-8eb7-92e8153df02d",
        "parentGlobalId" : "ddcb3d24-e116-41a1-8a3e-7978a4508670",
        "name" : "visitPhotoSpecies.POOL-20220320-130145.jpg",
        "contentType" : "image/jpeg",
        "size" : 208128,
        "keywords" : "visitPhotoSpecies.POOL",
        "exifInfo" : null
      }
    ]
  }
  But we don't get an explicit URL. So: vpS123.service constructs a URL from featureId and objectIds of attachments.
  */
function updateVisitAttachment(req, jsonArr) {
  return new Promise((resolve, reject) => {
    if (!req.query.visitId) {reject({message:'visitId required to Upsert attachments.'})}
    try {
      const typeArr = ['WOFR','SPSA','JESA','BLSA','FASH','CDFY','CLAM','OTHER','POOL'];
      var valArr = [];
      console.log('updateAttachment | jsonArr', jsonArr);
//      for (i=0; i<jsonArr.length; i++) { //iterate over objects in jsonArr
        var jsonInfo = jsonArr[i];
        var photoRow = {}; //single object of colum:value pairs for one insert row into vpvisit_photos
        photoRow['visitId']=req.query.visitId;
        var type = 'UNKNOWN';
        var keyw = jsonInfo.keywords.toUpperCase();
        for (j=0; j<typeArr.length; j++) {
          type = keyw.includes(typeArr[j])?typeArr[j]:'UNKNOWN';
        }
        switch(type) {
          case 'POOL':
            photoRow['visitPoolPhoto']=jsonInfo.url;
            break;
          case 'WOFR':
            photoRow['visitWoodFrogPhoto']=jsonInfo.url;
            break;
          case 'SPSA':
            photoRow['visitSpsPhoto']=jsonInfo.url;
            break;
          case 'JESA':
            photoRow['visitJesaPhoto']=jsonInfo.url;
            break;
          case 'BLSA':
            photoRow['visitBssaPhoto']=jsonInfo.url;
            break;
          case 'FASH':
            photoRow['visitFairyShrimpPhoto']=jsonInfo.url;
            break;
          case 'CLAM':
            photoRow['visitFingerNailClamsPhoto']=jsonInfo.url;
            break;
          case 'OTHER':
          case 'UNKNOWN':
            photoRow['visitSpeciesOtherPhoto']=jsonInfo.url;
            break;
        } //end switch
/*
        valArr.push(photoRow);
      } //end for loop
*/
      var columns = [];
      var query = null;
      var photoColumns = tableColumns['vpvisit']; //make a copy so it can be altered in case of UPDATE, below.
      //https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise
      columns = new db.pgp.helpers.ColumnSet(photoColumns, {table: 'vpvisit'});
      query = db.pgp.helpers.update(valArr, columns);
      query += ' RETURNING "visitId", ';
      console.log('vpVisit.s123.service::updateAttachment | query', query); //verbatim query with values for testing
      //console.log('vpVisit.s123.service::updateAttachment | columns', columns);
      //console.log('vpVisit.s123.service::updateAttachment | values', valArr);
      db.pgpDb.many(query) //'many' for expected return values
        .then(res => {
          console.log('vpVisit.s123.service::updateAttachment | pgpDb SUCCESS', res);
          resolve(res);
        })
        .catch(err => {
          console.log('vpVisit.s123.service::upsert | pgpDb ERROR', err.message);
          reject(err);
        }); //end pgpDb
    } catch (err) {
      console.log('vpVisit.s123.service::updateAttachment | try-catch ERROR', err.message);
      reject(err);
    }
  }); //end Promise
}

/*
  INSERT or UPDATE an array of attachmentInfos for a single visitId
*/
function upsertAttachments(req, jsonParent) {
  var update = 0;
  return new Promise((resolve, reject) => {
    if (!req.query.visitId) {reject({message:'visitId required to Upsert attachments.'})}
    try {
      console.log('upsertAttachments | jsonParent:', jsonParent);
      if (req.query) {update = !!req.query.update;}
      const typeArr = ['WOFR','SPSA','JESA','BLSA','BSSA','FASH','CDFY','FNC','OTHER','POOL'];
      var valArr = [];
      var jsonArr = jsonParent.attachmentInfos;
      console.log('upsertAttachments | jsonArr', jsonArr);
      for (i=0; i<jsonArr.length; i++) { //iterate over jsonData objects in jsonArray
        var photoRow = {}; //single object of colum:value pairs for one insert row into vpvisit_photos
        photoRow['visitPhotoVisitId']=req.query.visitId;
        photoRow['visitPhotoUrl']=jsonArr[i].url;
        photoRow['visitPhotoName']=jsonArr[i].name;
        var type = 'UNKNOWN';
        var keyw = jsonArr[i].keywords.toUpperCase();
        for (j=0; j<typeArr.length; j++) {
          type = keyw.includes(typeArr[j])?typeArr[j]:'UNKNOWN';
        }
        photoRow['visitPhotoSpecies']=type;
        valArr.push(photoRow);
      } //end for loop
      var columns = [];
      var query = null;
      var photoColumns = tableColumns['vpvisit_photos']; //make a copy so it can be altered in case of UPDATE, below.
      //https://stackoverflow.com/questions/37300997/multi-row-insert-with-pg-promise
      columns = new db.pgp.helpers.ColumnSet(photoColumns, {table: 'vpvisit_photos'});
      query = db.pgp.helpers.insert(valArr, columns);
      if (update) {
        query += `
        ON CONFLICT ON CONSTRAINT "vpvisit_photos_unique_visitId_species_url"
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
