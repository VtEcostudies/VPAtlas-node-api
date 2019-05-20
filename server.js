require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');

// Command-Line Arguments Processing
// These are processed without prefixed "-"
// Space-delimited args
var http = 0;
var argPort = 0;
var importFile = null;

console.log(process.argv);

for (var i=0; i<process.argv.length; i++) {
	switch(process.argv[i]) {
		case "noauth":
			noauth = 1;
			break;
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
            argPort = process.argv[++i];
            console.log(`argPort: ${argPort}`);
            break;
        case "prod":
            argPort=4321;
            break;
        case "import":
            //importFile = process.argv[++i];
            //if (!importFile) {importFile='~/data/import/vpmapped.csv';}
            importFile='~/data/import/vpmapped.csv';
            break;
	}
}

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

// start server
var srvPort = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
if (argPort) srvPort = argPort;
const server = app.listen(srvPort, function () {
    console.log('Server listening on port ' + srvPort);
});

if (importFile) {
    console.log('importFile:', importFile);
    const mappedService = require('vpMapped/vpMapped.service');
    //mappedService.importCSV(importFile);
    mappedService.importCSV();
}