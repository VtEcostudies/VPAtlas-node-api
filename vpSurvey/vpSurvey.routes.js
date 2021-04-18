const express = require('express');
const router = express.Router();
const service = require('./vpSurvey.service');

const multer = require('multer');
const csv = require('fast-csv');
const upFile = multer({ dest: 'vpsurvey/uploads/' });

// routes NOTE: routes with names for same method (ie. GET) must be above routes
// for things like /:id, or they are missed/skipped.
router.get('/geojson', getGeoJson);
router.get('/columns', getColumns);
router.get('/count', getCount);
router.get('/', getAll);
router.get('/:id', getById);
router.get('/pool/:poolId', getByPoolId);
router.post('/upload', upFile.single('vpsurvey.csv'), upload);
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

function getAll(req, res, next) {
    service.getAll(req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getById(req, res, next) {
    service.getById(req.params.id)
        .then(item => item ? res.json(item) : res.sendStatus(404))
        .catch(err => next(err));
}

function getByPoolId(req, res, next) {
    service.getById(req.params.poolId)
        .then(item => item ? res.json(item) : res.sendStatus(404))
        .catch(err => next(err));
}

function getGeoJson(req, res, next) {
    console.log('vpSurvey.routes | getGeoJson', req.query);
    service.getGeoJson(req.query)
        .then(items => {
            if (items.rows && items.rows[0].geojson) {
              if (req.query.download) {
                    var file = JSON.stringify(items.rows[0].geojson);
                    res.setHeader('Content-disposition', 'attachment; filename=vpSurvey.geojson');
                    res.setHeader('Content-type', 'application/json');
                    res.send(file); //res.send not res.json
              } else {res.json(items.rows[0].geojson);}
            }
            else {res.json(items);}
        })
        .catch(err => next(err));
}

function upload(req, res, next) {
    console.log(`upload req.file:`);
    console.dir(req.file);
    service.upload(req)
        .then((item) => {res.json(item);})
        .catch(err => {
            console.log('vpSurvey.routes.upload | error: ' , err.message, err.code);
            next(err);
        });
}

function create(req, res, next) {
    console.log(`create req.body:`);
    console.dir(req.body);
    service.create(req.body)
        .then((item) => {res.json(item);})
        .catch(err => {
            console.log('vpSurvey.routes.create | error: ' , err);
            next(err);
        });
}

function update(req, res, next) {
    console.log('vpSurvey.routes.update', req.body);
    service.update(req.params.id, req.body)
        .then((item) => {res.json(item);})
        .catch(err => {
            console.log('vpSurvey.routes.update | error: ' , err);
            if (err.code == 23505 && err.constraint == 'vpSurvey_pkey') {
                err.name = 'UniquenessConstraintViolation';
                err.message = `Review ID '${req.body.reviewId}' is already taken. Please choose a different Review ID.`;
            }
            next(err);
        });
}

function _delete(req, res, next) {
    service.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
