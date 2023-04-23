const os = require("os");
const process = require('process');
const config = require('../config.json');
const os_env = os.hostname()=='vpatlas.org' ? 'prod' : (os.hostname()=='dev.vpatlas.org' ? 'dev-remote' : 'dev-local');
const prc_env = process.env;
const api_env = prc_env.NODE_ENV ? prc_env.NODE_ENV : 'dev-local';
const db_env = config.pg[api_env];

const env = {
    os_host: os.hostname,
    os_env: os_env,
    api_env: api_env,
    db_env: db_env
}

console.log('env.js | env', env);

module.exports = {
    env: env
}