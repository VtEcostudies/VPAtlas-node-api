require('rootpath')();
const fs = require('fs');
const https = require('https');
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');
const os = require("os");
const os_env = os.hostname()=='vpatlas.org'?'prod':(os.hostname()=='dev.vpatlas.org'?'dev-remote':'dev-local');
const process = require('process');
const env = process.env;
var api_env = env.NODE_ENV?env.NODE_ENV:'dev-local';
var serverConfig = {
  tls: 0,
  port: 4000,
  host: 'localhost',
}
var debug = false;

console.log(`os_hostname |`, os.hostname());
console.log('os_env |', os_env);
console.log('NODE_ENV |', env.NODE_ENV);
console.log('api_env |', api_env);

//if no explicit NODE_ENV, attempt to interpret the server context from OS hostname and set api environment from that
if (!env.NODE_ENV) {
  console.log('AMBIGUOUS SERVER CONTEXT... setting api_env = os_env...')
  api_env = os_env;
}

switch(api_env) {
  default:
  case 'dev-local':
    serverConfig = {tls: 0, port: 4000, host: 'localhost'};
    break;
  case 'dev-remote':
    serverConfig = {tls: 1, port: 4322, host: 'dev.vpatlas.org'};
    break;
  case 'production':
  case 'prod':
    serverConfig = {tls: 1, port: 4322, host: 'vpatlas.org'};
    break;
}

/* Command-Line Arguments Processing
 These are processed without prefixed "-"
 Space-delimited args
*/
console.log('Use command-line arguments like this: http/https/http2 | debug | port=5000 | dev-remote/prod');
for (var i=0; i<process.argv.length; i++) {
    var all = process.argv[i].split('='); //the ith command-line argument
    var act = all[0]; //action, left of action=argument
    var arg = all[1]; //argument, right of action=argument
    console.log(`command-line argument ${i}`, all);
	switch(act) {
    case debug:
      debug = true;
      break;
		case "http":
			serverConfig.tls = 0;
      serverConfig.port = 4321;
			break;
		case "https":
      serverConfig.tls = 1;
      serverConfig.port = 4322;
			break;
		case "http2":
      serverConfig.tls = 2;
      serverConfig.port = 4322;
			break;
    case "port":
      serverConfig.port = arg;
      break;
    case "dev-remote":
      serverConfig.tls = 1;
      serverConfig.port = 4322;
      serverConfig.host = 'dev.vpatlas.org';
      break;
    case "production":
    case "prod":
      serverConfig.tls = 1;
      serverConfig.port = 4322;
      serverConfig.host = 'vpatlas.org';
      break;
	}
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

//debug middleware to get request info for display
app.use(function (req, res, next) {
  //console.log('server.js | request:', req);
  if (debug) {
    console.log('server.js | req.method', req.method);
    console.log('server.js | req.originalUrl', req.originalUrl);
    console.log('server.js | req.headers', req.headers);
    console.log('server.js | req.params', req.params);
    console.log('server.js | req.query', req.query);
    console.log('server.js | req.file', req.file);
  } else {
    console.log('server.js | req.method:', req.method,
    '| req.origUrl:', req.originalUrl,
    '| req.params:', req.params,
    '| req.query', req.query);
  }
  next();
});

// use JWT auth to secure the api
app.use(jwt());

try {
  //test the db connection first. each of the below routes include services that make a db connection, creating lots of errors.
  const db = require('_helpers/db_postgres');
  // api routes
  app.use('/users', require('./users/vpUser.routes.pg')); //postgres user db
  app.use('/vtinfo', require('./vtInfo/vtInfo.routes')); //postgres vermont data - counties, towns, etc.
  app.use('/pools/mapped', require('./vpMapped/vpMapped.routes')); //postgres mapped pools db
  app.use('/pools/visit', require('./vpVisit/vpVisit.routes')); //postgres pool visits db
  app.use('/mapped', require('./vpMapped/vpMapped.routes')); //postgres mapped pools db
  app.use('/visit', require('./vpVisit/vpVisit.routes')); //postgres visits db for survey123 data handling
  app.use('/pools', require('./vpPools/vpPools.routes')); //postgres 'Mapped Pools' and 'Pool Visits' GETS-only combined
  app.use('/review', require('./vpReview/vpReview.routes')); //postgres reviews db
  app.use('/survey', require('./vpSurvey/vpSurvey.routes')); //postgres survey db
  app.use('/aws/s3', require('./vpUtil/vp_s3_info.routes')); //get connection credentials for aws s3 bucket by bucketName
  app.use('/parcel', require('./vcgiMapData/vcgiParcel.routes')); //get parcel map geoJSON
  app.use('/utils', require('./vpUtil/vpUtils.routes')); //utils to test API features like where clause handling
} catch(err) {
  console.log('attempt to open db failed |', err);
  process.exit();
}

// global error handler
//NOTE: this causes error when http status is set in handler. No solution yet.
app.use(errorHandler);

var certConfig = {
  path: `/etc/letsencrypt/live/${serverConfig.host}`,
  key: 'privkey.pem',
  cert: 'fullchain.pem'
};
var keyFile = null;
var certFile = null;
var server = null;

console.log('serverConfig |', serverConfig);

//create server and listen
if (serverConfig.tls > 0) {
  console.log('certConfig |', certConfig);
  fs.readFile(`${certConfig.path}/${certConfig.key}`, (err, data) => {
    if (err) {
      console.log(err); process.exit();}
    else { //else-1
      keyFile = data;
      fs.readFile(`${certConfig.path}/${certConfig.cert}`, (err, data) => {
        if (err) {console.log(err); process.exit();}
        else { //else-2
          certFile = data;
          httpsServer(keyFile, certFile);
        } //end else-2
      }); //readFile-2
    } //end else-1
  }); //readFile-1
} else {
  httpServer();
}

function httpServer() {
  server = app.listen(serverConfig.port, () => {console.log(`http server listening on ${serverConfig.port}`);});
}
function httpsServer(keyFile, certFile) {
  server = https.createServer({
      key: keyFile,
      cert: certFile
  }, app).listen(serverConfig.port, () => {console.log(`https server listening on ${serverConfig.port}`);});
}
