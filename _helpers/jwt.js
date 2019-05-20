const expressJwt = require('express-jwt');
const config = require('config.json');
//const userService = require('../users/user.service');
const userService = require('../users/vpUser.service.pg');

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
    return expressJwt({ secret, isRevoked }).unless({
    //var ret = expressJwt({ secret, isRevoked }).unless({
        path: [
            /*
             public routes that don't require authentication
             https://stackoverflow.com/questions/30559158/handling-parameterised-routes-in-express-jwt-using-unless
             */
            '/users/authenticate',
            '/users/register',
            '/pools/mapped/count',
            '/pools/mapped', // /pools/mapped performs a getAll()
            { url: /^\/pools\/mapped\/.*/, methods: ['GET'] }, // /pools/mapped/:id
            { url: /^\/pools\/mapped\/page\/.*/, methods: ['GET'] } // /pools/mapped/page/:page
        ]
    });
    
    //console.log('jwt.js|jwt()|return: ', ret);
    //return;
}

async function isRevoked(req, payload, done) {
    
    console.log(`jwt.js|isRevoked()
                |req.body:[${Object.keys(req.body)}] [${Object.values(req.body)}]
                |payload:[${Object.keys(payload)}] [${Object.values(payload)}]`
                );
    
    const user = await userService.getById(payload.sub);

    // revoke token if user no longer exists
    if (!user) {
        return done(null, true);
    }

    return done();
};