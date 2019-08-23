require('rootpath')();
const fs = require('fs');
const https = require('https');
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');
const vpMappedModel = require('vpMapped/vpMapped.model.js');
const vtInfoModel = require('vtInfo/vtInfo.model.js');

// Command-Line Arguments Processing
// These are processed without prefixed "-"
// Space-delimited args
var tls = 0;
var argPort = 0; //this server's listening port

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

//debug middleware to get request info for display
app.use(function (req, res, next) {
  console.log('request:', req.method, req.originalUrl, req.params);
  next();
});

// use JWT auth to secure the api
app.use(jwt());

// api routes
//app.use('/users', require('./users/users.controller')); //mongo user db
app.use('/users', require('./users/vpUser.routes.pg')); //postgres user db
app.use('/vtinfo', require('./vtInfo/vtInfo.routes')); //postgres vermont data - counties, towns, etc.
app.use('/pools/mapped', require('./vpMapped/vpMapped.routes')); //postgres mapped pools db
app.use('/pools/visit', require('./vpVisit/vpVisit.routes')); //postgres pool visits db
app.use('/pools', require('./vpPools/vpPools.routes')); //postgres 'Mapped Pools' and 'Pool Visits' GETS-only combined
app.use('/aws/s3', require('./vpUtil/vp_s3_info.routes')); //get connection credentials for aws s3 bucket by bucketName

// global error handler
//NOTE: this causes error when http status is set in handler. No solution yet.
app.use(errorHandler);

console.log('command-line arguments:', process.argv);

for (var i=0; i<process.argv.length; i++) {
    var all = process.argv[i].split('=');
    var act = all[0];
    var arg = all[1];
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
        case "prod":
            tls=1;
            argPort=4322;
            break;
        case "init":
            vpMappedModel.initVpMapped();
            break;
        case "upgrade":
            switch(arg) {
                case "mapped":
                case "vpmapped":
                    vpMappedModel.upgradeVpMapped();
                    break;
                case "county":
                case "counties":
                    vtInfoModel.importCounties();
                    break;
                case "town":
                case "towns":
                    vtInfoModel.importTowns();
                    break;
            }
	}
}
//get port
var srvPort = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
if (argPort) srvPort = argPort;

//create server and listen
var server = null;
if (tls > 0) {
  server = https.createServer({
      key: fs.readFileSync('/etc/letsencrypt/live/vpatlas.org/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/vpatlas.org/fullchain.pem')
  }, app).listen(srvPort, () => {console.log(`https server listening on ${srvPort}`);});
} else {
  server = app.listen(srvPort, () => {console.log(`http server listening on ${srvPort}`);});
}
