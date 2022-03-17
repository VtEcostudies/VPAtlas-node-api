const express = require('express');
const router = express.Router();
const service = require('./vpVisit.service');
const uploads = require('./vpVisit.upload.service');
const s123svc = require('./vpVisit.s123.service');

const multer = require('multer');
const upFile = multer({ dest: 'vpvisit/uploads/' });

// routes NOTE: routes with names for same method (ie. GET) must be above routes
// for things like /:id, or they are missed/skipped.
router.get('/geojson', getGeoJson);
router.get('/columns', getColumns);
router.get('/count', getCount);
router.get('/overview', getOverview);
router.get('/', getAll);
router.get('/page/:page', getPage);
router.get('/s123', getS123);
router.get('/:id', getById);
router.get('/upload/history', getUploadHistory);
router.post('/s123', postS123);
router.post('/', create);
router.post('/upload', upFile.single('visitUploadFile'), upload);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function getColumns(req, res, next) {
    service.getColumns()
        .then(columns => res.json(columns))
        .catch(err => next(err));
}

function getS123(req, res, next) {
    s123svc.getS123Data(req)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function postS123(req, res, next) {
    s123svc.getUpsertS123Data(req)
        .then(items => res.json(items))
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

function getOverview(req, res, next) {
    service.getOverview(req.query)
        .then(items => res.json(items))
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
        .then(item => {
          console.log(item.rows);
          item ? res.json(item) : res.sendStatus(404);
        })
        .catch(err => next(err));
}

function getGeoJson(req, res, next) {
    console.log('vpVisit.routes | getGeoJson', req.query);
    service.getGeoJson(req.query)
        .then(items => {
            if (items.rows && items.rows[0].geojson) {
              if (req.query.download) {
                    var file = JSON.stringify(items.rows[0].geojson);
                    res.setHeader('Content-disposition', 'attachment; filename=vpvisit.geojson');
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

function upload(req, res, next) {
    console.log('vpVisit.routes::upload() | req.file:', req.file);
    console.log('vpVisit.routes::upload() | req.body', req.body);
    console.log('vpVisit.routes::upload() | req.query', req.query);
    uploads.upload(req)
        .then((item) => {res.json(item);})
        .catch(err => {
            console.log('vpVisit.routes::upload() | error: ', err.code, '|', err.message, '|', err.detail);
            next(err);
        });
}

function getUploadHistory(req, res, next) {
    uploads.history(req.query)
        .then(items => res.json(items))
        .catch(err => next(err));
}
