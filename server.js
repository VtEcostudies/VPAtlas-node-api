require('rootpath')();
const fs = require('fs');
const https = require('https');
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');
var serverName = 'localhost'; //use serverName to find eg. SSL certs
var debug = false;

/* Command-Line Arguments Processing
 These are processed without prefixed "-"
 Space-delimited args
*/
var tls = 0;
var argPort = 0; //this server's listening port
//console.log('command-line arguments:', process.argv);
for (var i=0; i<process.argv.length; i++) {
    var all = process.argv[i].split('='); //the ith command-line argument
    var act = all[0]; //action, left of action=argument
    var arg = all[1]; //argument, right of action=argument
    console.log(`command-line argument ${i}`, all);
	switch(act) {
		case "http":
			tls=0;
			break;
		case "https":
			tls=1;
      argPort=4322;
			break;
		case "http2":
			tls=2;
      argPort=4322;
			break;
    case "port":
        argPort = arg;
        break;
    case "dev-remote":
        tls=1;
        argPort=4322;
        serverName='dev.vpatlas.org';
        break;
    case "prod":
        tls=1;
        argPort=4322;
        serverName='vpatlas.org';
        break;
	}
}
//set this API's port - dev-local:4000, prod-http:4321, prod-https:4322
var srvPort = 4000;
if (argPort) srvPort = argPort;
//debug = 4000 == srvPort;

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

// api routes
app.use('/users', require('./users/vpUser.routes.pg')); //postgres user db
app.use('/vtinfo', require('./vtInfo/vtInfo.routes')); //postgres vermont data - counties, towns, etc.
app.use('/pools/mapped', require('./vpMapped/vpMapped.routes')); //postgres mapped pools db
app.use('/pools/visit', require('./vpVisit/vpVisit.routes')); //postgres pool visits db
app.use('/pools', require('./vpPools/vpPools.routes')); //postgres 'Mapped Pools' and 'Pool Visits' GETS-only combined
app.use('/review', require('./vpReview/vpReview.routes')); //postgres reviews db
app.use('/survey', require('./vpSurvey/vpSurvey.routes')); //postgres survey db
app.use('/aws/s3', require('./vpUtil/vp_s3_info.routes')); //get connection credentials for aws s3 bucket by bucketName
app.use('/parcel', require('./vcgiMapData/vcgiParcel.routes')); //get parcel map geoJSON
app.use('/utils', require('./vpUtil/vpUtils.routes')); //utils to test API features like where clause handling

// global error handler
//NOTE: this causes error when http status is set in handler. No solution yet.
app.use(errorHandler);


//create server and listen
var server = null;
if (tls > 0) {
  server = https.createServer({
      key: fs.readFileSync(`/etc/letsencrypt/live/${serverName}/privkey.pem`),
      cert: fs.readFileSync(`/etc/letsencrypt/live/${serverName}/fullchain.pem`)
  }, app).listen(srvPort, () => {console.log(`https server listening on ${srvPort}`);});
} else {
  server = app.listen(srvPort, () => {console.log(`http server listening on ${srvPort}`);});
}
