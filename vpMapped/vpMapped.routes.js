const express = require('express');
const router = express.Router();
const poolService = require('./vpMapped.service');

// routes
router.get('/count', getCount);
router.get('/', getAll);
router.get('/page/:page', getPage);
router.get('/:id', getById);
router.post('/:id', create);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function getCount(req, res, next) {
    poolService.getCount(req.body)
        .then(pools => res.json(pools))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    poolService.getAll(req.body)
        .then(pools => res.json(pools))
        .catch(err => next(err));
}

function getPage(req, res, next) {
    console.log('getPage req.query', req.query);
    poolService.getPage(req.params.page, req.query)
        .then(pools => res.json(pools))
        .catch(err => next(err));
}

function getById(req, res, next) {
    poolService.getById(req.params.id)
        .then(pool => pool ? res.json(pool) : res.sendStatus(404))
        .catch(err => next(err));
}

function create(req, res, next) {
    poolService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function update(req, res, next) {
    poolService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    poolService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}