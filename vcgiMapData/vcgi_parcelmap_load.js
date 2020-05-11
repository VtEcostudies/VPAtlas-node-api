/*
  Author: Jason Loomis

  Project: VPAtlas

  File: vcgi_parcelmap_get.js

  Notes:
    We can download the entire parcelmap from VCGI, but KML is 1.4G. Mapbox's tool
    to convert KML => geoJSON crashes nodeJs on 'string too large'. Tried to increase
    node's max string size, but there were other issues. Whereas with other geoJSON
    files, we can compile them into the UI source code, an attempt to do so here crashed
    the Angular 9x compiler.

  Specifics:
  - GET geoJSON map data from VCGI API by town and store in postgres table by town
  as jsonb.
  - This is complicated because their API limits 'records' (more like features) to
  about 1000 items. To get a complete geoJSON file for a town, we often have to append
  features from multiple requests. getTownParcel uses recursion to do this, but it's
  tricky to use recursion with asynchronous nodeJs. I didn't have time to work all that
  out, so I left a harmless hack that uses async await.

  To-Do:
  - Add the ability to *Update* parcel maps as new data are available on vcgi.

*/
const db = require('../_helpers/db_postgres');
const query = db.query;
const https = require('https'); //https://nodejs.org/api/http.html

/*
  Command-Line Arguments Processing
  - Space-delimited args
*/
for (var i=2; i<process.argv.length; i++) {
  var all = process.argv[i].split('='); //the ith command-line argument
  var act = all[0]; //action, left of action=argument
  var arg = all[1]; //argument, right of action=argument
  console.log(`command-line argument ${i}`, all);
	switch(act) {
		case "town":
      loadParcels(arg);
			break;
    case null:
    case "":
      loadParcels();
      break;
    default:
      console.log('Invalid command-line argument. Use town=name.')
      break;
    }
}
if (process.argv.length < 2) {loadParcels();}

function loadParcels(townName=null) {
  console.log('Loading parcels for ', townName?townName:'All Towns')
  getTowns(townName)
    .then(async towns => {
      //console.dir(towns);
      for (var i=0; i<towns.rows.length; i++) {
      //for (var i=0; i<1; i++) {
        let pageSize = 500;
        let offset = 0;
        let end = false;
        let parcel = {};
        console.log(towns.rows[i].townName);
        await getTownParcel(towns.rows[i], pageSize, offset, end, parcel);
      }
    })
    .catch(err => {
      console.log(err.message);
    })
}

function getTowns(townName=null) {
    var where = '';
    var value = [];
    if (townName) {where = 'where upper("townName")=upper($1)'; value = [townName];}
    const text = `select * from vptown ${where} order by "townName";`;
    return query(text, value);
}

async function getTownParcel(town, pageSize, offset, end, parcel) {
  await httpsGetVcgiParcelPage(town.townName, pageSize, offset)
    .then(async data => {
      console.log(town.townName, pageSize, offset, data.features.length);
      if (0 == offset) {parcel = data;}
      else {parcel.features = parcel.features.concat(data.features);}
      end = !data.exceededTransferLimit;
      offset += pageSize;
      if (!end) {await getTownParcel(town, pageSize, offset, end, parcel);}
      else {
        insertVcgiParcel(town, parcel);
        console.log('getTownParcel finished getting parcel for', town.townName);
        return parcel;
      }
    })
    .catch(err => {
      end = true;
      console.log('getTownParcel', err.message);
      return(err);
    });
}

function httpsGetVcgiParcelPage(townName, pageSize, offset){
  var apiUrl = 'https://maps.vcgi.vermont.gov/arcgis/rest/services/EGC_services/OPENDATA_VCGI_CADASTRAL_SP_NOCACHE_v1/MapServer/17/query';
  var query = `?where=TOWN='${townName}'`;
  var fields = `&outFields=*`;
  var paging = `&resultOffset=${offset}&resultRecordCount=${pageSize}`;
  var types = `&outSR=4326&f=geojson`;
  var url = apiUrl+query+fields+paging+types;

  console.log('httpsGetVcgiParcelPage', url);

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      } else if (!/^application\/geo\+json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
                          `Expected application/json but received ${contentType}`);
      }
      if (error) {
        console.error(error.message);
        // Consume response data to free up memory
        res.resume();
        reject(error);
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(rawData);
          //console.log(jsonData);
          resolve(jsonData)
        } catch (e) {
          console.error(e.message);
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      reject(e);
    });
  });
}

/*
  Insert parcel data for one town.
  town is a vp town Object
  data is a geoJSON parcel featureCollection for one town from VCGI
*/
function insertVcgiParcel(town, data) {

  var sql_insert = `insert into vcgi_parcel ("vcgiTownId","vcgiTownName","vcgiParcel") values ($1, $2, $3) returning "vcgiTownName"`;

  console.log('insertVcgiParcel', town.townName, sql_insert);

  return new Promise((resolve, reject) => {
    query(sql_insert, [town.townId, town.townName, data])
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      })
  })
}
