/*
  Author: Jason Loomis

  Project: VPAtlas

  File: vcgi_parcelmap_get.js

  Notes:
    We can download the entire parcelmap from VCGI, but KML is 1.4G. Mapbox's tool
    to convert KML => geoJSON crashes nodeJs on 'string too large'. Tried to increase
    node's max strting size, but there were other issues. Whereas with other geoJSON
    files, we can compile them into the UI source code, an attempt to do so here crashed
    the Angular 9x compiler.

  Specifics:
  - GET geoJSON map data from VCGI API by town and store in postgres table by town
  as jsonb.
*/
const db = require('../_helpers/db_postgres');
const query = db.query;
const https = require('https'); //https://nodejs.org/api/http.html

getTowns()
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

function getTowns() {
    const text = `select * from vptown order by "townName";`;
    return query(text);
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
