module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    var ret;

    //This doesn't work. Need to find a way to determine when res.header has been set...
    console.log('error-handler | http status:', res.status, err.name, err.message);

/*
NOTE: setting res.status here causes error - can't set headers already sent to client.
https://stackoverflow.com/questions/7042340/error-cant-set-headers-after-they-are-sent-to-the-client
*/

    if (typeof (err) === 'string') {
        // custom application console.error();
        console.log('error-handler | string error | error:', err);
        ret = { message: err };
        next(res.status(400).json(ret));
    }

    else if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        console.log('error-handler | err.name:', err.name);
        err.message = 'Invalid Token';
        next(res.status(401).json(err));
    }

    else {
      ret = {
        name: err.name,
        code: err.code,
        severity: err.severity,
        message: err.message,
        hint: err.hint,
        detail: err.detail,
        table: err.table,
        constraint: err.constraint,
        column: err.column,
        dataType: err.dataType,
        where: err.where,
        file: err.file,
        line: err.line,
        routine: err.routine
      };
      console.log(`error-handler::errorHandler()`);
      console.dir(ret);
      //console.dir(err);
      // default to 500 server error
      //NOTE: this does not throw error. we assume that this is the same http error code as already set elsewhere.
      next(res.status(500).json(ret));
    }
}
