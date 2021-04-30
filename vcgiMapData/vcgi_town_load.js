/*
  Project: VPAtlas

  File: vcgi_town_load.js

  Notes:

  Download the entire geoJSON towns file:

  https://opendata.arcgis.com/datasets/0e4a5d2d58ac40bf87cd8aa950138ae8_39.geojson

  Specifics:
    - parse geoJSON towns file having a feature property TOWNNAME
    - use TOWNNAME to find town oject in vptown
    - ...

  To-Do:

*/
const db = require('../_helpers/db_postgres');
const query = db.query;
const https = require('https'); //https://nodejs.org/api/http.html
const fs = require('fs');
var town = null; //town to download, if just one
var dest = 'db'; //destination for downloads: 'db'=postgres, 'fs'=local file
const update = 1; //flag whether to update parcel data in the db

/*
  Command-Line Arguments Processing
  - Space-delimited args of the form action=value
  - example: 'node vcgi_parcelmap_load town=strafford dest=fs'
*/
for (var i=2; i<process.argv.length; i++) {
  var all = process.argv[i].split('='); //the ith command-line argument
  var act = all[0]; //action, left of action=argument
  var arg = all[1]; //argument, right of action=argument
  console.log(`command-line argument ${i}`, all);
	switch(act) {
		case "town":
      town = arg;
			break;
    default:
      console.log('Invalid command-line argument. Use town=name.')
      break;
    }
}

console.log(`Program arguments | town:${town}`);

loadTowns(town);

function loadTowns() {
  // read towns geoJSON file
  fs.readFile('./other_geoJSON/vcgi_town_polygons.geojson', 'utf-8', async (err, data) => {
      if (err) {
          throw err;
      }

      // parse geoJSON object read from file
      const towns = JSON.parse(data.toString());

      console.log(towns.name, towns.crs);

      for (i=0; i<towns.features.length; i++) {
          var feat = towns.features[i];
          var name = feat.properties.TOWNNAME;
          await getTown(name)
            .then(town => {
                console.log(town);
                var townGeo = {
                  "crs":towns.crs,
                  "type":feat.geometry.type,
                  "coordinates":feat.geometry.coordinates
                };
                insertGeoTown(town, townGeo)
                  .then(res => {
                    //Success. Nothing to say.
                  })
                  .catch(err => {
                    fs.writeFile(`./town_geoJSON/error_insertGeoTown_${name}.txt`, JSON.stringify(err), (err) => {
                      console.log('ERROR | fs.writeFile |', err);
                    });
                  })
            })
            .catch(err => {
              console.log(`ERROR | getTown | rowCount:${err.rows.length}`);
              fs.writeFile(`./town_geoJSON/error_getTown_${name}.txt`, JSON.stringify(err), (err) => {
                console.log('ERROR | fs.writeFile |', err);
              });
            })
      }
  });
}

/*
  Get array of towns (well, a node-pg result set).
  Optionally, perform exact-match search by townName.
  Optionally, perform different comparison search. PostGRES allows:
    - LIKE (must use % as wildcard)
    - NOT LIKE
    - !=
*/
function getTowns(townName='', operator=`=`) {
    var where = '';
    var value = [];
    if (townName) {where = `where upper("townName") ${operator} upper($1)`; value = [townName];}
    const text = `select * from vptown ${where} order by "townName";`;
    return query(text, value);
}

/*
  Get one town by name.
  Returns single object for town, or error.
*/
function getTown(townName='', operator=`=`) {
  return new Promise((resolve, reject) => {
    getTowns(townName, operator)
      .then(res => {
        if (res.rows && 1 == res.rows.length) {resolve(res.rows[0]);}
        else {reject({error:true, message:"Wrong number of rows.", rows:res.rows});}
      })
      .catch(err => {
        reject(err);
      });
  })
}

/*
  Insert Polygon Geometry for one town.
  town is a vp town Object like
  data is a geoJSON feature
*/
function insertGeoTown(town, data) {

  var sql_insert = `
  insert into geo_town ("geoTownId","geoTownPolygon")
  VALUES ($1, ST_GeomFromGeoJSON($2))`;

  console.log('insertGeoTown', town, sql_insert);

  return new Promise((resolve, reject) => {
    query(sql_insert, [town.townId, data])
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        console.log('ERROR | insertGeoTown |', err.message);
        reject(err);
      })
  });
}
