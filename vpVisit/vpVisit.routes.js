﻿const express = require('express');
const router = express.Router();
const convert = require('json-2-csv');
const service = require('./vpVisit.service');
const uploads = require('./vpVisit.upload.service');
const s123svc = require('./vpVisit.s123.service');
const multer = require('multer');
const upFile = multer({ dest: 'vpvisit/uploads/' });

// routes NOTE: routes with names for same method (ie. GET) must be above routes
// for things like /:id, or they are missed/skipped.
router.get('/csv', getCsv);
router.get('/geojson', getGeoJson);
router.get('/columns', getColumns);
router.get('/count', getCount);
router.get('/overview', getOverview);
router.get('/', getAll);
router.get('/page/:page', getPage);
router.get('/s123', getS123);
router.get('/s123/attachments', getS123attachments);
router.get('/:id', getById);
router.get('/upload/history', getUploadHistory);
router.post('/s123', postS123);
router.post('/s123/attachments', postS123Attachments);
router.post('/s123/all', postS123All);
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
    s123svc.getData(req)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function postS123(req, res, next) {
    s123svc.getUpsertData(req)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function postS123All(req, res, next) {
    s123svc.getUpsertAll(req)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function getS123attachments(req, res, next) {
    s123svc.getAttachments(req)
        .then(items => res.json(items))
        .catch(err => next(err));
}

function postS123Attachments(req, res, next) {
    s123svc.getUpsertAttachments(req)
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

function getCsv(req, res, next) {
    console.log('vpVisit.routes | getCsv', req.query);
    service.getAll(req.query)
        .then(items => {
            if (items.rows) {
              convert.json2csv(items.rows, (err, csv) => {
                if (err) next(err);
                if (req.query.download) {
                      var file = csv;
                      res.setHeader('Content-disposition', 'attachment; filename=vp_visit.csv');
                      res.setHeader('Content-type', 'text/csv');
                      res.send(file); //res.send not res.json
                } else {
                  res.send(csv);
                }
              });
            }
            else {res.json(items);}
        })
        .catch(err => next(err));
}

/*
  Here's how to use http to query same param for list of values:

  http://localhost:4000/mapped/geojson?mappedPoolStatus|NOT IN=Confirmed&mappedPoolStatus|NOT IN=Probable
  http://localhost:4000/mapped/geojson?mappedPoolStatus|IN=Confirmed&mappedPoolStatus|IN=Probable
*/
function getGeoJson(req, res, next) {
    console.log('vpVisit.routes::getGeoJson | req.query:', req.query);
    console.log('vpVisit.routes::getGeoJson | req.user:', req.user);

    var statusParam = req.query.mappedPoolStatus || req.query['mappedPoolStatus|IN'] || req.query['mappedPoolStatus|NOT IN'];

    if (!statusParam && (!req.user || (req.user && req.user.userrole != 'admin'))) {
      req.query['mappedPoolStatus|NOT IN'] = [ 'Eliminated', 'Duplicate' ];
    }

    service.getGeoJson(req.query)
        .then(items => {
            if (items.rows && items.rows[0].geojson) {
              if (req.query.download) {
                    var file = JSON.stringify(items.rows[0].geojson);
                    res.setHeader('Content-disposition', 'attachment; filename=vp_visit.geojson');
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
