require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');

// Command-Line Arguments Processing
// This MUST occur before the requires() below. Note that appVersion, which corresponds to the
// server-specific API version (the default of which is defined in config.js), CAN be overridden
// via the command line.
var noauth = 0;
var http = 0;
var argPort = 0;

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
            argPort=process.argv[++i];
            console.log(`argPort: ${argPort}`);
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
app.use('/pools/mapped', require('./vpMapped/vpMapped.routes'));

// global error handler
app.use(errorHandler);

// start server
var srvPort = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
if (argPort) srvPort = argPort;
const server = app.listen(srvPort, function () {
    console.log('Server listening on port ' + srvPort);
});
