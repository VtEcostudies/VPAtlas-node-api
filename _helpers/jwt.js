const expressJwt = require('express-jwt');
const config = require('config.json');
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
    const algorithms = ['HS256']; //NOTE: This has to match user.service jwt.sign algorithm.
    return expressJwt({ secret, algorithms, isRevoked }).unless({
    //var ret = expressJwt({ secret, isRevoked }).unless({
        path: [
            /*
             public routes that don't require authentication
             https://stackoverflow.com/questions/30559158/handling-parameterised-routes-in-express-jwt-using-unless
             */
            '/users/authenticate',
            '/users/register',
            '/users/reset',
            '/users/verify',
            '/users/confirm',

            '/utils/where',

            '/vtinfo/towns',
            '/parcel/townId/*',
            '/parcel/townName',
            { url: /^\/parcel\/townName\/.*/, methods: ['GET'] }, // /parcel/townName/:name

            '/pools/mapped', // /pools/mapped performs a getAll()
            { url: /^\/pools\/mapped\/.*/, methods: ['GET'] }, // /pools/mapped/:id
            { url: /^\/pools\/mapped\/page\/.*/, methods: ['GET'] }, // /pools/mapped/page/:page

            '/pools/visit', // /pools/visit performs a getAll()
            { url: /^\/pools\/visit\/.*/, methods: ['GET'] },
            { url: /^\/pools\/visit\/page\/.*/, methods: ['GET'] },

            '/pools', // /pools performs a getAll()
            { url: /^\/pools\/.*/, methods: ['GET'] },
            { url: /^\/pools\/page\/.*/, methods: ['GET'] },

            '/survey', // /survey performs a getAll()
            '/survey/upload',
            '/survey/columns',
            { url: /^\/survey\/.*/, methods: ['GET'] },
            { url: /^\/survey\/page\/.*/, methods: ['GET'] }
        ]
    });

    //console.log('jwt.js|jwt()|return: ', ret);
    //return;
}

/*
    NOTE - here is explanation on how to use express-jwt:

        https://github.com/auth0/express-jwt#usage

    It's as simple as this:

        jwt adds req.user to the req object. use it.
        if it's missing values, we can add them here by setting req.user

    Actually, it's more secure to use a user record retrieved from the DB
    here, than to trust the values in the incoming token. Use that, instead.
*/
async function isRevoked(req, payload, done) {

    console.log(`jwt.js::isRevoked()
                req.body:[${Object.keys(req.body)}] [${Object.values(req.body)}]
                payload:[${Object.keys(payload)}] [${Object.values(payload)}]`
                );

    if (payload.sub) {
      req.user = await userService.getById(payload.sub);
    }

    // revoke token if user no longer exists or not found
    if (!req.user) {
        return done(null, true);
    }

    //console.dir(req.user);

    return done();
};
