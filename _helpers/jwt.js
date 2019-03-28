const expressJwt = require('express-jwt');
const config = require('config.json');
const userService = require('../users/user.service');

module.exports = jwt;

/*
https://hptechblogs.com/using-json-web-token-for-authentication/
https://www.npmjs.com/package/express-jwt

How express-jwt parses the request is opaque here. However, via Postman include an Authorization Request Header:

Header Type: Authorization, Bearer Token

Example: Key: Authorization, Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YzhmZmM5YTBmYWViNjIyMWMwNmM5NzgiLCJpYXQiOjE1NTI5OTIwODV9.PRQffRTZZ4jLQ-7nkEtQQ0BFdLsnB5FBmgmLyFyqv90
 */
function jwt() {
    const secret = config.secret;
    //return expressJwt({ secret, isRevoked }).unless({
    var ret = expressJwt({ secret, isRevoked }).unless({
        path: [
            // public routes that don't require authentication
            '/users/authenticate',
            '/users/register',
            '/pools/mapped',
            '/pools/mapped/:id',
            '/pools/mapped/count',
            '/pools/mapped/page/:page',
            '/pools/mapped/page/',
            '/pools/mapped/page'
        ]
    });
    console.log('jwt.js|jwt()|return: ', ret);
    return ret;
}

async function isRevoked(req, payload, done) {
    
    console.log(`jwt.js|isRevoked()
                |req.body:[${Object.keys(req.body)}] [${Object.values(req.body)}]
                |payload:[${Object.keys(payload)}] [${Object.values(req.body)}]`
                );
    
    const user = await userService.getById(payload.sub);

    // revoke token if user no longer exists
    if (!user) {
        return done(null, true);
    }

    done();
};