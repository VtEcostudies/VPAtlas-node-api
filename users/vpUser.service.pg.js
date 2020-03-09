const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db_postgres');
const query = db.query;
const pgUtil = require('_helpers/db_pg_util');
const sendmail = require('./sendmail');
var staticColumns = []; //file scope list of vpuser table columns retrieved on app startup (see 'getColumns()' below)

module.exports = {
    authenticate,
    getColumns,
    getAll,
    getPage,
    getById,
    getByUserName,
    register,
    update,
    reset,
    verify,
    confirm,
    new_email,
    delete: _delete
};

function getColumns() {
    console.log(`vpUser.service.getColumns | staticColumns:`, staticColumns);
    return staticColumns;
}

//run it once on init: to create the array here. also diplays on console.
pgUtil.getColumns("vpuser", staticColumns)
    .then(res => {return res;})
    .catch(err => {
        console.log(`vpUser.service.pg.pgUtil.getColumns`, err.message);
    });

/*
Authenticate user. Handle both registration confirmation and plain login.

Registration confirmation is different only in that a registration token is in
the body. When that's true, query with additional where clause token parameter,
and on successful auth set token=null and status='confirmed'.
*/
async function authenticate(body) {
    if (!body.username || !body.password) {throw 'Username and password are required.';}
    try {
        var select = `select * from vpuser where username=$1;`;
        var update = `update vpuser set token=null,status='confirmed' where username=$1 and token=$2 returning *;`;
        var args = [body.username];
        if (body.token) {
          select = `select * from vpuser where username=$1 and token=$2;`;
          args = [body.username, body.token];
        }
        console.log(select, args);
        const res = await query(select, args);
        const user = res.rows[0];
        console.log(`vpuser.pg.service.authenticate | user: `, user);
        if (user && bcrypt.compareSync(body.password, user.hash)) {
            if (user.status=='confirmed' || body.token) { //confirmed and register and new_email...
              delete user.hash;
              const token = jwt.sign({ sub: user.id, role: user.userrole }, config.secret, { expiresIn: config.token.loginExpiry });
              if (body.token) {
                console.log(update, args);
                query(update, args)
                  .then(ret => { console.log('token verified, nulled.'); return { user, token }; })
                  .catch(err => {console.log('unknown error on status update.'); throw(err);});
              } else {
                return { user, token }; //interesting - this generates object key:value pairs from variable names and content...
              }
            } else {
              var message = `Invalid user status: '${user.status}.' `;
              switch (user.status) {
                case 'registration':
                  message += 'Please complete the registration process using your emailed registration token.'
                  break;
                case 'reset':
                  message += 'Please complete the password reset process using your emailed reset token.'
                  break;
                case 'invalid':
                  message = 'This user login is invalid because the email account could not be verified.'
                  break;
                case 'new_email':
                  message = 'This user login is invalid because a change of email address has not been confirmed.'
                  break;
            }
              throw message;
            }
        } else {
            throw 'Username or password is incorrect.';
        }
    } catch(err) {
        throw err;
    }
}

async function getAll(body={}) {
    const where = pgUtil.whereClause(body, staticColumns);
    const text = `select * from vpuser ${where.text};`;
    console.log(`vpUser.service.pg.js getAll`, text, where.values);
    try {
        var res = await query(text, where.values);
        return res.rows;
    } catch(err) {
        throw err;
    }
}

async function getPage(page, params={}) {
    page = Number(page) ? Number(page) : 1;
    const pageSize = Number(params.pageSize) ? Number(params.pageSize) : 10;
    const offset = (page-1) * pageSize;
    var orderClause = '';
    if (params.orderBy) {
        var col = params.orderBy.split("|")[0];
        var dir = params.orderBy.split("|")[1]; dir = dir ? dir : '';
        orderClause = `order by "${col}" ${dir}`;
    }
    var where = pgUtil.whereClause(params, staticColumns); //whereClause filters output against vpuser.columns
    const text = `select (select count(*) from vpuser ${where.text}),* from vpuser ${where.text} ${orderClause} offset ${offset} limit ${pageSize};`;
    console.log(`vpUser.service.pg.js getPage`, text, where.values);
    try {
        var res = await query(text, where.values);
        return res.rows;
    } catch(err) {
        throw err;
    }
}

/*
 * NOTE: tried handling promise, here, with .catch, .then. Doesn't work
 * with await. Neither does it appear to work without await. See commented
 * code below.
 *
 * It does appear that await is meant to be used with the old-school try {}
 * catch {} formulation.
 */
async function getById(id) {
    try {
        var res = await query(`select * from vpuser where "id"=$1;`, [id]);
        if (res.rowCount == 1) {
            delete res.rows[0].hash;
            return res.rows[0];
        } else {
            console.log(`vpUser.service.pg.js::getByID ${id} NOT Found`);
            return {};
        }
    } catch(err) {
        console.log(`vpUser.service.pg.js::getByID error`, err);
        throw err;
    }
}

async function getByUserName(username) {
    try {
        var res = await query(`select * from vpuser where "username"=$1;`, [username]);
        if (res.rowCount == 1) {
            delete res.rows[0].hash;
            return res.rows[0];
        } else {
            console.log(`vpUser.service.pg.js::getByID ${id} NOT Found`);
            return {};
        }
    } catch(err) {
        console.log(`vpUser.service.pg.js::getByID error`, err);
        throw err;
    }
}

/*
  Register a user with email registration token flow.
*/
function register(body) {
    return new Promise((resolve, reject) => {
        body.token = jwt.sign({ registration:true, email:body.email }, config.secret, { expiresIn: config.token.registrationExpiry });
        body.status = 'registration';
        body.userrole = 'user'; //default role is 'user' role.
        // hash password, add to body object, delete password from body object
        if (body.password) {
            body.hash = bcrypt.hashSync(body.password, 10);
            delete body.password;
        }

        var queryColumns = pgUtil.parseColumns(body, 1, [], staticColumns);
        text = `insert into vpuser (${queryColumns.named}) values (${queryColumns.numbered}) returning id;`;
        console.log(text, queryColumns.values);
        query(text, queryColumns.values)
          .then(res => {
            console.log('vpUser.service.pg.js::register | rowCount, user id ', res.rowCount, res.rows[0].id);
            sendmail.register(body.email, body.token)
              .then(ret => {resolve(ret);})
              .catch(err => {reject(err)});
          })
          .catch(err => {
              console.log('vpUser.service.pg.js::register | ERROR ', err.message);
              if (err.code == 23505 && err.constraint == 'vpuser_pkey') {
                  err.name = 'Uniqueness Constraint Violation';
                  err.hint = 'Please choose a different username.';
                  err.message = `username '${body.username}' is already taken.`;
              }
              if (err.code == 23505 && err.constraint == 'unique_email') {
                  err.name = 'Uniqueness Constraint Violation';
                  err.hint = 'Please login with the account attached to this email.';
                  err.message = `email '${body.email}' has already registered.`;
              }
              if (err.code == 23502) {
                  err.name = 'Not-null Constraint Violation';
                  err.hint = 'Please enter all required values.';
                  delete err.detail; //contains entire existing record - insecure
              }
              reject(err);
          });
    });
}

/*
  Simple update of user profile data.
  Password resets are done via the reset flow.
  User role change is done by administrative function. (TBD)
*/
async function update(id, body) {

    delete body.password; //don't allow password update here. only use reset flow.
    //delete body.userrole; //don't allow role change on update yet.

    var queryColumns = pgUtil.parseColumns(body, 2, [id], staticColumns);
    text = `update vpuser set (${queryColumns.named}) = (${queryColumns.numbered}) where "id"=$1;`;
    console.log(text, queryColumns.values);
    return await query(text, queryColumns.values);
}

/*
  Reset user password by email. Call this route to set a new user password before
  sending a reset email/token. This route will invalidate the old password and
  send an email with reset link containing a reset token.

  - verify user email. if found:
  - set db reset token (for comparison on /confirm route)
  - send email with url and reset token
*/
function reset(email) {
    return new Promise((resolve, reject) => {
      const token = jwt.sign({ reset:true, email:email }, config.secret, { expiresIn: config.token.resetExpiry });
      text = `update vpuser set token=$2,status='reset' where "email"=$1 returning id,email,token;`;
      console.log(text, [email, token]);
      query(text, [email, token])
        .then(res => {
          console.log('vpUser.service.pg.js::reset | rowCount ', res.rowCount);
          if (res.rowCount == 1) {
            sendmail.reset(res.rows[0].email, res.rows[0].token)
              .then(ret => {resolve(ret);})
              .catch(err => {reject(err)});
          } else {
            console.log('vpUser.service.pg.js::reset | ERROR', `email ${email} NOT found.`);
            reject(new Error(`email ${email} NOT found.`));
          }
        })
        .catch(err => {
          console.log('vpUser.service.pg.js::reset | ERROR ', err.message);
          reject(err.message);
        });
    });
}

/*
  Change user email. Call this route to set a new_email token before
  sending a new_email email/token. This route will emulate the registration
  flow, requiring that the user logs in from the new email token.

  - verify user email. if found:
  - set db new_email token (for comparison on /authenticate route)
  - send email with url and new_email token
*/
function new_email(id, email) {
    return new Promise((resolve, reject) => {
      const token = jwt.sign({ new_email:true, email:email }, config.secret, { expiresIn: config.token.resetExpiry });
      text = `update vpuser set email=$2,token=$3,status='new_email' where id=$1 returning id,email,token;`;
      console.log(text, [id, email, token]);
      query(text, [id, email, token])
        .then(res => {
          console.log('vpUser.service.pg.js::new_email | rowCount ', res.rowCount);
          if (res.rowCount == 1) {
            sendmail.new_email(res.rows[0].email, res.rows[0].token)
              .then(ret => {resolve(ret);})
              .catch(err => {reject(err)});
          } else {
            console.log('vpUser.service.pg.js::new_email | ERROR', `email ${email} NOT found.`);
            reject(new Error(`email ${email} NOT found.`));
          }
        })
        .catch(err => {
          console.log('vpUser.service.pg.js::new_email | ERROR ', err.message);
          reject(err.message);
        });
    });
}

/*
Verify a valid token that maps to a user in the db having the included email.

We handle 2 types of tokens: registration and reset. When the token is parsed,
it will include a payload with either reset=true or registration=true and an
email address. By receiving this token and successfully decoding, this function
verifies that we have a valid user.
*/
function verify(token) {
  console.log('vpUser.service.pg.js::verify | token', token);

  return new Promise((resolve, reject) => {
    jwt.verify(token, config.secret, function(err, payload) {
      if (err) {
        console.log('vpUser.service.pg.js::verify | ERROR', err);
        reject(err);
      }
      payload.now = Date.now();
      console.dir(payload);
      //multi-use token: verify and re-verify until token expires
      var text = `select * from vpuser where email=$1 and token=$2;`;
      console.log(text);
      query(text, [payload.email, token])
        .then(res => {
          console.log(res.rows[0]);
          if (res.rows[0]) {
            delete res.rows[0].hash; //remove password hash for security
            delete res.rows[0].token; //ditto
            resolve(res.rows[0]);
          } else {
            reject(new Error('Cannot verify. User email/token NOT found.'))
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  });
}

/*
  Confirm what? How does this flow work again?
*/
function confirm(token, password) {
  // hash password
  var hash = bcrypt.hashSync(password, 10);

  console.log('vpUser.service.pg.js::confirm | inputs', token, hash);

  return new Promise((resolve, reject) => {
    jwt.verify(token, config.secret, function(err, payload) {
      if (err) {
        console.log('vpUser.service.pg.js::confirm | ERROR', err);
        reject(err);
      }
      payload.now = Date.now();
      console.dir(payload);
      //confirm token validity and update password in one stroke...
      var text = `update vpuser set hash=$3,token=null,status='confirmed' where "email"=$1 and "token"=$2 returning *;`;
      console.log(text);
      query(text, [payload.email, token, hash])
        .then(res => {
          console.log(res.rows[0]);
          if (res.rows[0]) {
            delete res.rows[0].hash; //remove password hash for security
            delete res.rows[0].token; //ditto
            resolve(res.rows[0]);
          } else {
            reject(new Error('Cannot confirm. User email/token NOT found.'))
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  });
}

async function _delete(id) {
    return await query(`delete from vpuser where "id"=$1;`, [id]);
}
