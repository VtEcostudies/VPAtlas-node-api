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
const maximumFeatureId = 8;
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

 //you MUST parseInt on string values used to contol for-loops!!!
function getUpsertAll(req) {
  abort = 0; //always start this way
  return new Promise(async (resolve, reject) => {
    var offset = req.query.offset?parseInt(req.query.offset):1; //you MUST parseInt on string values used to contol for-loops!!!
    var limit = req.query.limit?parseInt(req.query.limit):1; //you MUST parseInt on string values used to contol for-loops!!!
    var stop = offset + limit;
    var sucs = [], errs = []; counts = {};
    for (z=offset; z<stop; z++) {
      req.query.featureId = 0;
      req.query.objectId = z;
      if (abort) {
        break;
      } else {
        await getUpsertData(req)
          .then(res => {
            //console.log('vpVisit.s123.service::getupsertAll | RESULTS', res);
            sucs.push(res);
          })
          .catch(err => {
            console.log('vpVisit.s123.service::getupsertAll | ERROR | err.message:', err.message, err);
            errs.push(err)
          });
      }//end else
    }
    counts.success = sucs.length;
    counts.errors = errs.length;
    counts.target = limit;
    counts.total = z - offset;
    counts.aborted = abort;
    console.log('vpVisit.s123.service::getupsertAll | RESULTS |', counts);
    resolve({counts:counts, results:sucs, errors:errs})
  });
}

function getUpsertData(req) {
  return new Promise((resolve, reject) => {
    if (!req.query.serviceId) {req.query.serviceId = defaultServiceId;}
    vpS123Util.getData(req.query)
      .then(jsonData => {
        upsertVisit(req, [jsonData]) //put a single json Data object into array for future multi-object upsertVisit
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
function upsertVisit(req, jsonArr) {
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
        ON CONFLICT ON CONSTRAINT "unique_visitGlobalId"
        DO UPDATE SET ("${visitColumns.join('","')}")=(EXCLUDED."${visitColumns.join('",EXCLUDED."')}")`;
      }
      query += ' RETURNING "visitId","visitPoolId","visitGlobalId","visitObjectId","visitDataUrl","createdAt"!="updatedAt" AS updated ';
      //console.log('vpVisit.s123.service::upsertVisit | query', query); //verbatim query with values for testing
      //console.log('vpVisit.s123.service::upsertVisit | columns', columns);
      //console.log('vpVisit.s123.service::upsertVisit | values', valArr);
    } catch (err) {
      console.log('vpVisit.s123.service::upsertVisit | try-catch ERROR', err.message);
      reject(err);
    }
    db.pgpDb.many(query) //'many' for expected return values
      .then(res_data => {
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
        console.log('vpVisit.s123.service::upsertVisit | pgpDb ERROR', err.message);
        reject(err);
      }); //end pgpDb
  }); //end Promise
}

function fixJsonColumnsData(jsonArr) {
  for (i=0; i<jsonArr.length; i++) { //iterate over jsonData objects in jsonArray
      jsonArr[i]["visitGlobalId"]=jsonArr[i]["globalid"]; //S123 global ID returned from API
      jsonArr[i]["visitObjectId"]=jsonArr[i]["objectid"]; //S123 object ID requested and returned from API
      jsonArr[i]["visitDataUrl"]=jsonArr[i]["dataUrl"]; //S123 data URL constructed within our query to ESRI
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
      jsonArr[i]["visitWoodFrogAdults"]=jsonArr[i]["visitWoodFrogAdults"]+0;
      jsonArr[i]["visitWoodFrogLarvae"]=jsonArr[i]["visitWoodFrogLarvae"]+0;
      jsonArr[i]["visitWoodFrogEgg"]=jsonArr[i]["visitWoodFrogEgg"]+0;
      jsonArr[i]["visitWoodFrogEggHow"]=jsonArr[i]["visitWoodFrogEggHow"];
      jsonArr[i]["visitSpsAdults"]=jsonArr[i]["visitSpsAdults"]+0;
      jsonArr[i]["visitSpsLarvae"]=jsonArr[i]["visitSpsLarvae"]+0;
      jsonArr[i]["visitSpsEgg"]=jsonArr[i]["visitSpsEgg"]+0;
      jsonArr[i]["visitSpsEggHow"]=jsonArr[i]["visitSpsEggHow"];
      jsonArr[i]["visitJesaAdults"]=jsonArr[i]["visitJesaAdults"]+0;
      jsonArr[i]["visitJesaLarvae"]=jsonArr[i]["visitJesaLarvae"]+0;
      jsonArr[i]["visitJesaEgg"]=jsonArr[i]["visitJesaEgg"]+0;
      jsonArr[i]["visitJesaEggHow"]=jsonArr[i]["visitJesaEggHow"];
      jsonArr[i]["visitBssaAdults"]=jsonArr[i]["visitBssaAdults"]+0;
      jsonArr[i]["visitBssaLarvae"]=jsonArr[i]["visitBssaLarvae"]+0;
      jsonArr[i]["visitBssaEgg"]=jsonArr[i]["visitBssaEgg"]+0;
      jsonArr[i]["visitBssaEggHow"]=jsonArr[i]["visitBssaEggHow"];
      jsonArr[i]["visitFairyShrimp"]=jsonArr[i]["visitFairyShrimp"]+0;
      jsonArr[i]["visitFingerNailClams"]=jsonArr[i]["visitFingernailClam"]+0;
      jsonArr[i]["visitSpeciesOtherName"]=jsonArr[i]["visitOther"];
      jsonArr[i]["visitSpeciesComments"]=jsonArr[i]["visitMiscNotes"];
      jsonArr[i]["visitFish"]=!!jsonArr[i]["visitFish"]; //convert integers to boolean
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
- required: objectId from the parent Visit
- optional: featureId of featureServer to limit results to a single repeatTable
  - featureId == [1, 2, 3, ...8] for VPVisit

Without a featureId, getAttachments loops over all featureIds for VPVisit.
*/
function getAttachments(req) {
  return new Promise(async (resolve, reject) => {
    var beg=1, end=maximumFeatureId, parentId=0, atchArr=[], atchErr=[];
    if (!req.query.serviceId) {req.query.serviceId = defaultServiceId;}
    //if (!req.query.featureId) {req.query.featureId = defaultFeatureId;}
    if (req.query.featureId) {beg=req.query.featureId; end=req.query.featureId;}
    else {beg=1; end=maximumFeatureId;}
    for (var i=beg; i<=end; i++) {
      req.query.featureId=i;
      await vpS123Util.getRepeatAttachments(req.query)
        .then(jsonParent => {
          console.log(i, '| vpVisit.s123.service::getAttachments | SUCCESS', jsonParent);
          parentId = jsonParent.parentObjectId;
          atchArr = atchArr.concat(jsonParent.attachmentInfos);
        })
        .catch(err => {
          console.log(i, '| vpVisit.s123.service::getAttachments | ERROR', err.message);
          atchErr.push(err.message);
        }); //end getRepeatAttachments
      } //end for-loop
      console.log('vpVisit.s123.service::getAttachments | ERRORS', atchErr);
      console.log('vpVisit.s123.service::getAttachments | RESULTS', atchArr);
      resolve({parentObjectId:parentId, attachmentInfos:atchArr});
    }); //end promise
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
        getAttachments(req)
          .then(jsonParent => { //this getAttachments now retruns an array of attachmentInfos within a parent object
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
  INSERT or UPDATE an array of attachmentInfos for a single visitId into the new
  table vpvisit_photos.
*/
function upsertAttachments(req, jsonParent) {
  var update = 0;
  return new Promise((resolve, reject) => {
    if (!req.query.visitId) {reject({message:'visitId required to Upsert attachments.'})}
    try {
      if (req.query) {update = !!req.query.update;}
      //const typeArr = ['WOFR','SPSA','JESA','BLSA','BSSA','FASH','CDFY','FNC','OTHER','POOL'];
      var valArr = [];
      var jsonArr = jsonParent.attachmentInfos;
      console.log('upsertAttachments | jsonArr', jsonArr);
      for (i=0; i<jsonArr.length; i++) { //iterate over jsonData objects in jsonArray
        var photoRow = {}; //single object of colum:value pairs for one insert row into vpvisit_photos
        photoRow['visitPhotoVisitId']=req.query.visitId;
        photoRow['visitPhotoUrl']=jsonArr[i].url;
        photoRow['visitPhotoName']=jsonArr[i].name;
        photoRow['visitPhotoSpecies']=attachFeatureIds[jsonArr[i].featureServerId]; //we set this now for each attachmentInfo in vpS123.service::getFeatureAttachmentInfo(...)
/*
        var type = 'UNKNOWN';
        var keyw = jsonArr[i].keywords.toUpperCase();
        for (j=0; j<typeArr.length; j++) {
          type = keyw.includes(typeArr[j])?typeArr[j]:'UNKNOWN';
        }
        photoRow['visitPhotoSpecies']=type;
*/
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
      console.log('vpVisit.s123.service::upsertAttachments | query', query); //verbatim query with values for testing
      //console.log('vpVisit.s123.service::upsertAttachments | columns', columns);
      //console.log('vpVisit.s123.service::upsertAttachments | values', valArr);
      db.pgpDb.many(query) //'many' for expected return values
        .then(res => {
          console.log('vpVisit.s123.service::upsertAttachments | pgpDb SUCCESS', res);
          resolve(res);
        })
        .catch(err => {
          console.log('vpVisit.s123.service::upsertAttachments| pgpDb ERROR', err.message);
          reject(err);
        }); //end pgpDb
    } catch (err) {
      console.log('vpVisit.s123.service::upsertAttachments | try-catch ERROR', err.message);
      reject(err);
    }
  }); //end Promise
}

/*
  Original Visit Photo Attachment Update, to update vpvisit table single-photo columns.
  This is deprecated and was not designed to use the VPVisit repeatTable S123 services.

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
    if (!req.query.visitId) {reject({message:'visitId required to Update attachments.'})}
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
          console.log('vpVisit.s123.service::updateAttachment | pgpDb ERROR', err.message);
          reject(err);
        }); //end pgpDb
    } catch (err) {
      console.log('vpVisit.s123.service::updateAttachment | try-catch ERROR', err.message);
      reject(err);
    }
  }); //end Promise
}
