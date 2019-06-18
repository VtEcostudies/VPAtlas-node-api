module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    var ret;
    
    console.log('error-handler.errorHandler',
                `err.name: ${err.name}`,
                `err.message: ${err.message}`,
                `err.hint: ${err.hint}`,
                `err.detail: ${err.detail}`
                );
    
/* NOTE: setting res.status here causes error - can't set headers already  sent to client. */
    
    if (typeof (err) === 'string') {
        // custom application error
        console.log('error-handler.errorHandler: string error');
        ret = res.status(400).json({ message: err });
    }
    if (err.name === 'UniquenessConstraintViolation') {
        // Postgres Uniqueness Constraint Violation - the return value, err.name, is a custom setting in each service
        console.log('error-handler.errorHandler: ', err.name);
        //ret = res.status(409).json({ message: err.message, hint: err.hint, detail: err.detail });
        ret = res.status(500).json({ message: err.message, hint: err.hint, detail: err.detail });
    }
    if (err.name === 'ValidationError') {
        // mongoose validation error
        console.log('error-handler.errorHandler: ', err.name);
        ret = res.status(400).json({ message: err.message, hint: err.hint });
    }


    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        console.log('error-handler.errorHandler: ', err.name);
        ret = res.status(401).json({ message: 'Invalid Token' });
    }

    // default to 500 server error
    //NOTE: this does not throw error. we assume that this is the same http error code as already set elsewhere.
    ret = res.status(500).json({ message: err.message, hint: err.hint, detail: err.detail });
    
    return ret;
}