/*
    Mid-Alpha development, the team decided that 'Mapped Pools' and 'Pool Visits'
    should just be one list of items having different amounts of data. This module
    serves the gets for those joined table queries.
*/
const express = require('express');
const router = express.Router();
const service = require('./vpPools.service');

// routes
router.get('/count', getCount);
router.get('/', getAll);
router.get('/page/:page', getPage);
router.get('/visitId/:visitId', getByVisitId);
router.get('/poolId/:poolId', getByPoolId);

module.exports = router;

function getCount(req, res, next) {
    service.getCount(req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    console.log('vpPools.routes.getAll req.query', req.query);
    service.getAll(req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getPage(req, res, next) {
    console.log('vpPools.routes.getPage req.query', req.query);
    service.getPage(req.params.page, req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getByVisitId(req, res, next) {
    console.log('vpPools.routes.getByVisitId req.query', req.query);
    service.getByVisitId(req.params.visitId, req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getByPoolId(req, res, next) {
    console.log('vpPools.routes.getByPoolId req.query', req.query);
    service.getByPoolId(req.params.poolId, req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}
