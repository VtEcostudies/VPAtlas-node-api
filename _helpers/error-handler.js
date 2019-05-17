module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    
    console.log('error-handler.errorHandler', `err.name: ${err.name}`, `err.message: ${err.message}`,  `err.hint: ${err.hint}`);
    
    var ret;
    
    if (typeof (err) === 'string') {
        // custom application error
        console.log('error-handler.errorHandler: string error');
        ret = res.status(400).json({ message: err });
    }

    if (err.name === 'ValidationError') {
        // mongoose validation error
        console.log('error-handler.errorHandler: ValidationError');
        ret = res.status(400).json({ message: err.message, hint: err.hint });
    }

    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        console.log('error-handler.errorHandler: UnauthorizedError');
        ret = res.status(401).json({ message: 'Invalid Token' });
    }

    // default to 500 server error
    ret = res.status(500).json({ message: err.message, hint: err.hint });
    
    //console.log(err.name, err.message,  err.hint);
    
    return ret;
}