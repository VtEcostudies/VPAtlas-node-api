const express = require('express');
const router = express.Router();
const service = require('./vpVisit.service');

// routes
router.get('/columns', getColumns);
router.get('/count', getCount);
router.get('/', getAll);
router.get('/page/:page', getPage);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function getColumns(req, res, next) {
    service.getColumns()
        .then(columns => res.json(columns))
        .catch(err => next(err));
}

function getCount(req, res, next) {
    service.getCount(req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getStats(req, res, next) {
    service.getStats(req.query)
        .then(stats => res.json(stats))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    service.getAll(req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getPage(req, res, next) {
    console.log('getPage req.query', req.query);
    service.getPage(req.params.page, req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getById(req, res, next) {
    service.getById(req.params.id)
        .then(item => item ? res.json(item) : res.sendStatus(404))
        .catch(err => next(err));
}

function create(req, res, next) {
    console.log(`create req.body:`);
    console.dir(req.body);
    service.create(req.body)
        .then((item) => res.json(item))
        .catch(err => {
            console.log('vpVisit.routes.create | error: ' , err);
            if (err.code == 23505 && err.constraint == 'vpvisit_pkey') {
                err.name = 'UniquenessConstraintViolation';
                err.message = `Visit ID '${req.body.visitId}' is already taken. Please choose a different Visit ID.`; 
            }
            next(err);
        });
}

function update(req, res, next) {
    console.log('vpVisit.routes.update', req.body);
    service.update(req.params.id, req.body)
        .then((item) => res.json(item))
        .catch(err => {
            console.log('vpVisit.routes.update | error: ' , err);
            if (err.code == 23505 && err.constraint == 'vpvisit_pkey') {
                err.name = 'UniquenessConstraintViolation';
                err.message = `Visit ID '${req.body.visitId}' is already taken. Please choose a different Visit ID.`; 
            }
            next(err);
        });
}

function _delete(req, res, next) {
    service.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}