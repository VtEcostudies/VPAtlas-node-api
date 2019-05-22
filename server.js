require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');
const vpMappedModel = require('vpMapped/vpMapped.model.js');

// Command-Line Arguments Processing
// These are processed without prefixed "-"
// Space-delimited args
var http = 0;
var argPort = 0;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api
app.use(jwt());

// api routes
//app.use('/users', require('./users/users.controller')); //mongo user db
app.use('/users', require('./users/vpUser.routes.pg')); //postgres user db
app.use('/pools/mapped', require('./vpMapped/vpMapped.routes')); //postgres mapped pools db

// global error handler
app.use(errorHandler);

console.log('command-line arguments:', process.argv);

for (var i=0; i<process.argv.length; i++) {
    var all = process.argv[i].split('=');
    var act = all[0];
    var arg = all[1];
    console.log(`command-line argument ${i}`, all);
	switch(act) {
		case "http":
			http=1;
			break;
		case "https":
			http=0;
			break;
		case "http2":
			http=2;
			break;
        case "port":
            argPort = arg;
            break;
        case "prod":
            argPort=4321;
            break;
        case "init":
            vpMappedModel.initVpMapped();
            break;
        case "upgrade":
            vpMappedModel.upgradeVpMapped();
            break;
	}
}

// start server
var srvPort = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
if (argPort) srvPort = argPort;
const server = app.listen(srvPort, function () {
    console.log('Server listening on port ' + srvPort);
});
/*
if (init) {
    const vpMappedModel = require('vpMapped/vpMapped.model.js');
    vpMappedModel.initVpMapped();
}

if (upgrade) {
    const vpMappedModel = require('vpMapped/vpMapped.model.js');
    vpMappedModel.upgradeV01();
}
*/