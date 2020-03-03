const express = require('express');
const router = express.Router();
const userService = require('./vpUser.service.pg');
const sendmail = require('./sendmail');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.post('/reset', reset);
router.get('/confirm', verify); //for testing purposes to verify a valid reset token with a GET (ie. browser easy)
router.post('/confirm', confirm);
router.get('/', getAll);
router.get('/page/:page', getPage);
router.get('/:id', getById);
//router.post('/', create); //same as /register - not needed
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function authenticate(req, res, next) {
    console.log(`vpUser.routes.pg.authenticate | req.body:`, req.body);
    userService.authenticate(req.body)
        //.then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .then(user => {
            console.dir(user);
            res.json(user);
        })
        .catch(err => next(err));
}

function register(req, res, next) {
    console.log(`users.pg.routes.register | req.body:`, req.body);
    userService.create(req.body)
        //.then(() => res.json({}))
        .then(user => res.json(user))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    console.log(`vpUser.routes.pg.js::getAll() | req.user`, req.user);
    if (req.user.role != 'admin') throw('Requesting User is not authorized to GET All Users.');
    userService.getAll(req.query)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getPage(req, res, next) {
    console.log(`vpUser.routes.pg.js::getPage() | req.user`, req.user);
    if (req.user.role != 'admin') throw('Requesting User is not authorized to GET All Users.');
    console.log('getPage req.query', req.query);
    userService.getPage(req.params.page, req.query)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getById(req, res, next) {
    console.log(`vpUser.routes.pg.js::getById() | req.user`, req.user);
    if (req.user.role != 'admin' && req.user.sub != req.params.id) {
        throw(`Requesting User is not authorized to GET Users by ID unless it's their own.`);
    }
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function create(req, res, next) {
    console.log(`create req.body:`,req.body);
    userService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function update(req, res, next) {
    console.log(`vpUser.routes.pg.js::update() | req.user`, req.user);
    if (req.user.role != 'admin' && req.user.sub != req.params.id) {
        throw(`Requesting User is not authorized to PUT Users by ID unless it's their own.`);
    }
    console.log(`update id ${req.params.id} req.body:`, req.body);
    userService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function reset(req, res, next) {
    console.log(`vpUser.routes.pg.js::reset() | req.body`, req.body);
    userService.reset(req.body.email)
        .then(ret => res.json(ret))
        .catch(err => next(err));
}

//reachable by GET, so easy to test token/email in browser
function verify(req, res, next) {
    console.log(`vpUser.routes.pg.js::verify() | req.query:`, req.query);
    userService.confirm(req.query)
        .then(ret => res.json(ret))
        .catch(err => next(err));
}

//can only be reached by POST, so we have control and put data in body
function confirm(req, res, next) {
    console.log(`vpUser.routes.pg.js::confirm() | req.body:`, req.body);
    userService.confirm(req.body.token, req.body.password)
        .then(ret => res.json(ret))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    console.log(`vpUser.routes.pg.js::delete() | req.user`, req.user);
    if (req.user.role != 'admin') throw('Requesting User is not authorized to DELETE Users.');
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
