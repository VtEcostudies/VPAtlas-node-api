module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    var ret;

    //This doesn't work. Need to find a way to determine when res.header has been set...
    //console.log('error-handler | http status:', res.status);

/*
NOTE: setting res.status here causes error - can't set headers already sent to client.
https://stackoverflow.com/questions/7042340/error-cant-set-headers-after-they-are-sent-to-the-client
*/

    if (typeof (err) === 'string') {
        // custom application error
        console.log('error-handler | err.name: string error | error:', err);
        return res.status(400).json({ message: err });
    }

    if (err.name === 'UniquenessConstraintViolation') {
        // Postgres Uniqueness Constraint Violation - the return value, err.name, is a custom setting in each service
        console.log('error-handler | err.name: ', err.name);
        //ret = res.status(409).json({ message: err.message, hint: err.hint, detail: err.detail });
        ret = { message: err.message, hint: err.hint, detail: err.detail };
    }

    if (err.name === 'ValidationError') {
        // mongoose validation error
        console.log('error-handler | err.name: ', err.name);
        //ret = res.status(400).json({ message: err.message, hint: err.hint });
        ret = { message: err.message, hint: err.hint };
    }

    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        console.log('error-handler | err.name:', err.name);
        //ret = res.status(401).json({ message: 'Invalid Token' });
        ret = { message: 'Invalid Token' };
    }

    console.log('error-handler.errorHandler',
                `err.name: ${err.name}`,
                `err.message: ${err.message}`,
                `err.hint: ${err.hint}`,
                `err.detail: ${err.detail}`
                );

    // default to 500 server error
    //NOTE: this does not throw error. we assume that this is the same http error code as already set elsewhere.
    ret = res.status(500).json({ message: err.message, hint: err.hint, detail: err.detail });
    //ret = { message: err.message, hint: err.hint, detail: err.detail };

    return ret;
}
