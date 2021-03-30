const express = require('express');
const router = express.Router();
const poolService = require('./vpMapped.service');

// routes NOTE: routes with names for same method (ie. GET) must be above routes
// for things like /:id, or they are missed/skipped.
router.get('/geojson', getGeoJson);
router.get('/columns', getColumns);
router.get('/count', getCount);
router.get('/stats', getStats);
router.get('/overview', getOverview);
router.get('/', getAll);
router.get('/page/:page', getPage);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function getColumns(req, res, next) {
    poolService.getColumns()
        .then(columns => res.json(columns))
        .catch(err => next(err));
}

function getCount(req, res, next) {
  console.log('vpMapped.routes | getCount');
    poolService.getCount(req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getStats(req, res, next) {
    console.log('vpMapped.routes | getStats');
    poolService.getStats(req.query)
        .then(stats => res.json(stats))
        .catch(err => next(err));
}

function getOverview(req, res, next) {
    poolService.getOverview(req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    poolService.getAll(req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getPage(req, res, next) {
    console.log('getPage req.query', req.query);
    poolService.getPage(req.params.page, req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getById(req, res, next) {
    poolService.getById(req.params.id)
        .then(item => item ? res.json(item) : res.sendStatus(404))
        .catch(err => next(err));
}

function getGeoJson(req, res, next) {
    console.log('vpMapped.routes | getGeoJson', req.query);
    poolService.getGeoJson(req.query)
        .then(items => {
            if (items.rows && items.rows[0].geojson) {
              if (req.query.download) {
                    var file = JSON.stringify(items.rows[0].geojson);
                    res.setHeader('Content-disposition', 'attachment; filename=vpmapped.geojson');
                    res.setHeader('Content-type', 'application/json');
                    res.send(file); //res.send not res.json
              } else {res.json(items.rows[0].geojson);}
            }
            else {res.json(items);}
        })
        .catch(err => next(err));
}

function create(req, res, next) {
    console.log(`create req.body:`);
    console.dir(req.body);
    poolService.create(req.body)
        .then((item) => res.json(item))
        .catch(err => {
            if (err.code == 23505 && err.constraint == 'vpmapped_pkey') {
                err.name = 'UniquenessConstraintViolation';
                err.message = `Pool ID '${req.body.mappedPoolId}' is already taken. Please choose a different Pool ID.`;
            }
            next(err);
        });
}

function update(req, res, next) {
    poolService.update(req.params.id, req.body)
        .then((item) => res.json(item))
        .catch(err => {
            if (err.code == 23505 && err.constraint == 'vpmapped_pkey') {
                err.name = 'UniquenessConstraintViolation';
                err.message = `Pool ID '${req.body.mappedPoolId}' is already taken. Please choose a different Pool ID.`;
            }
            next(err);
        });
}

function _delete(req, res, next) {
    poolService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
