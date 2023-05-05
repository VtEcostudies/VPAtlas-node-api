const env = require('_helpers/env').env;

module.exports = {
    shapeFile,
    procExec,
    tarZip
}

async function shapeFile(qry, fyl='shapefile', dir='shapefile', ext='tar.gz') {
    //console.log('QUERY BEFORE CLEANUP', JSON.stringify(qry));
    qry = qry.replace(/\n/g, ' '); //replace LF with spaces for pgsql2shp
    qry = qry.replace(/\r/g, ''); //remove CR for pgsql2shp
    qry = qry.replace(/["]/g,`\\"`); //escape double-quotes for pgsql2shp
    console.log('QUERY AFTER CLEANUP', qry);
    //console.log('QUERY AFTER CLEANUP', JSON.stringify(qry));
    let cmd = `rm -f ${dir}/* && pgsql2shp -f ${dir}/${fyl} -h ${env.db_env.host} -u ${env.db_env.user} -P ${env.db_env.password} ${env.db_env.database} "${qry}"`;
    console.log('db_shapefile::getShapeFile | cmd', cmd);
    return await new Promise((resolve, reject) => {
      procExec(cmd).then(async out => {
        tarZip(dir, fyl, ext).then(async res => {
          console.log(`getShapeFile=>tarZip | success`, `${dir}/${fyl}`);
          resolve({all:`${dir}/${fyl}.${ext}`, filename:`${fyl}.${ext}`, subdir:dir});
        })
        .catch(async err => {
          console.log(`getShapeFile=>tarZip | error`, err);
          reject(err);
        })
      })
      .catch(async err => {
        console.log(`getShapeFile=>procExec | error`, err);
        reject(err);
      })
    })
  }

async function tarZip(dir='shapefile', fyl='vpmapped', ext='tar.gz') {
    let cmd = `cd ${dir} && tar -czf ${fyl}.${ext} *`;
    console.log('db_shapefile::tarZip | cmd', cmd);
    return await procExec(cmd);
  }

async function procExec(cmd) {
    var cp = require('child_process');
    var ch = cp.exec(cmd);
    return await new Promise((resolve, reject) => {
      let info = {}; let iter = 0;
      let errs = {}; let erri = 0;
      ch.on('close', () => {
        console.log('db_shapefile::procExec=>close | cmd:', cmd, '| info:', info, '| error:', errs);
        if (!erri) {resolve({'info': info, 'error': errs});}
        else {reject({'info': info, 'error': errs});}
      })
      ch.stdout.on('data', (data) => {
        console.log('db_shapefile::procExec=>stdOUT=>data:', data);
        info[iter++] = data;
      });
      ch.stderr.on('data', derr => {
        console.log('db_shapefile::procExec=>stdERR=>data:', derr)
        errs[erri++] = derr;
      })
      ch.on('error', err => {
        console.log('db_shapefile::procExec=>error | child-process error:', err)
        reject({'info': info, 'error': err});
      })
    })
  }
  