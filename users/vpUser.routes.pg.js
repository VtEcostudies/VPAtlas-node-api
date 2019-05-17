const express = require('express');
const router = express.Router();
const userService = require('./vpUser.service.pg');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.get('/', getAll);
router.get('/page/:page', getPage);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function authenticate(req, res, next) {
    console.log(`vpUser.routes.pg.authenticate | req.body:`, req.body);
    userService.authenticate(req.body)
        //.then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .then(user => res.json(user))
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
    userService.getAll(req.query)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getPage(req, res, next) {
    console.log('getPage req.query', req.query);
    userService.getPage(req.params.page, req.query)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getById(req, res, next) {
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
    console.log(`update req.body:`, req.body);
    userService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}