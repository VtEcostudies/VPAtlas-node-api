const express = require('express');
const router = express.Router();
const service = require('./vpUtils.service');

// routes
router.get('/where', testWhereClause);

module.exports = router;

function testWhereClause(req, res, next) {
    console.log('vpUtils.routes.testWhereClause req.query', req.query);
    service.testWhereClause(req)
        .then(items => res.json(items))
        .catch(err => next(err));
}
