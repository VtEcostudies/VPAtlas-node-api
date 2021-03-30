/*
  Project: VPAtlas

  File: vcgi_town_load.js

  Notes:

  Download the entire geoJSON towns file:

  https://opendata.arcgis.com/datasets/0e4a5d2d58ac40bf87cd8aa950138ae8_39.geojson

  Specifics:

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
    case "dest":
      dest = arg;
      break;
    case null:
    case "":
      //loadTowns();
      break;
    default:
      console.log('Invalid command-line argument. Use town=name and/or dest=fs/db.')
      break;
    }
}
//if (process.argv.length == 2) {loadTowns(town, dest);} //no arguments
console.log(`Program arguments | town:${town} | destination: ${dest}`);

loadTowns(town);

function loadTowns() {
  // read towns geoJSON file
  fs.readFile('./town_geoJSON/vcgi_town_polygons.geojson', 'utf-8', async (err, data) => {
      if (err) {
          throw err;
      }

      // parse JSON object
      const towns = JSON.parse(data.toString());

      console.log(towns.name, towns.crs);

      for (i=0; i<towns.features.length; i++) {
      //for (i=0; i<1; i++) {
          var feat = towns.features[i];
          var name = feat.properties.TOWNNAME;
          await getTowns(name)
            .then(towns => {
              if (1 != towns.rows.length) {
                console.log(`ERROR | getTowns | rowCount:${towns.rows.length}`);
                fs.writeFile(`./town_geoJSON/error_getTowns_${name}.txt`, JSON.stringify(towns), (err) =>{
                  console.log('ERROR | fs.writeFile |', err);
                });
              } else {
                var town = towns.rows[0];
                console.log(town);
                var tGeo = {
                  "crs":towns.crs,
                  "type":feat.geometry.type,
                  "coordinates":feat.geometry.coordinates
                };
                insertGeoTown(town, tGeo)
                  .then(res => {

                  })
                  .catch(err => {
                    fs.writefile(`./town_geoJSON/error_insertGeoTown_${name}.txt`, JSON.stringify(err));
                  })
                }
            })
            .catch(err => {
              console.log('ERROR', err.message);
            })
      }
  });
}

/*
  Just get one town, but return whatever and handle it in the calling code.
*/
function getTowns(townName) {
    var where = '';
    var value = [];
    if (townName) {where = 'where upper("townName")=upper($1)'; value = [townName];}
    const text = `select * from vptown ${where} order by "townName";`;
    return query(text, value);
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
