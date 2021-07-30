const express = require("express");
const db = require("./db");
const router = express.Router();
let jwt = require("jsonwebtoken");
const config = require("../../middleware/config.json"); // refresh
let tokenChecker = require("../../middleware/tockenchecker");
const tokenList = {};
const _response = require('../common/middleware/api-response')
const responsemsg = require('../common/middleware/response-msg')
const responsecode = require('../common/middleware/response-code')
const response = require('../common/middleware/api-response')
const Joi = require('@hapi/joi')
const bcrypt = require('bcrypt');
const commonServe = require('../common/services/commonServices')
const multer = require('multer');


module.exports = function (router) {
    router.get('/gallery', list);
    router.post('/gallery', add);
    router.put('/gallery/:id', update);
    router.get('/gallery/:id', details);
    router.delete('/gallery/:id', _delete);
}


function add(req, res) {
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let avatar = req.files.file;
            avatar.mv('./gallery/' + avatar.name);
            req.body.url = "https://"+req.get('host')+"/"+ avatar.name
            db.query("INSERT INTO gallery SET ?", req.body , (err, result) => {
                if (!err) {
                    result.url = req.body.url
                    return _response.apiSuccess(res, responsemsg.saveSuccess , result)
                } else {
                    return _response.apiFailed(res, err , result)
                }
            });

        }
    } catch (err) {
        res.status(500).send(err);
    }


    /*   console.log('User not exist')
       db.query("INSERT INTO gallery SET ?", req.body , (err, result) => {
           if (!err) {
               return _response.apiSuccess(res, responsemsg.saveSuccess , result)
           } else {
               return _response.apiFailed(res, err , result)
           }
       });*/


}

async function list(req, res) {

    var limit = 500;
    var page = 1;
    var totalDocs = 0;
    if (req.query.page) {
        page = req.query.page
    }
    if (req.query.limit) {
        limit = req.query.limit
    }
    var offset = (page - 1) * limit


    db.query("SELECT COUNT(*) AS total FROM gallery", (err, result) => {
        if (!err) {
            totalDocs = result[0].total
        } else {

        }
    });


    //Search by String
    if (req.query.search_string && req.query.search_string !== '') {

        db.query("SELECT * FROM gallery WHERE CONCAT(title) REGEXP '" + req.query.search_string + "'  LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
            if (!err && result.length > 0) {
                return _response.apiSuccess(res, result.length + " " + responsemsg.found, result, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalDocs: totalDocs
                })

            } else {
                return _response.apiFailed(res, responsemsg.listIsEmpty)
            }
        });


    } else {
        db.query("SELECT * FROM gallery LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
            if (!err) {
                return _response.apiSuccess(res, result.length + " " + responsemsg.found, result, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalDocs: totalDocs
                })

            } else {
                return _response.apiFailed(res, responsemsg.listIsEmpty)
            }
        });
    }


}

function update(req, res) {
    var formData = []

    if (req.params.id) {
        db.query("SELECT * FROM `gallery` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!err && result.length > 0) {

                db.query("UPDATE gallery SET ? WHERE id = '" + req.params.id + "'", req.body, (err, result) => {
                    if (!err) {
                        return _response.apiSuccess(res, responsemsg.updateSuccess)
                    } else {
                        return _response.apiFailed(res, err)
                    }
                })

            } else {
                return _response.apiFailed(res, err)
            }
        });

    } else {
        return _response.apiWarning(res, 'Please select id.')

    }
}

function details(req, res) {
    //const result = bcrypt.compareSync('123', hash);
    if (req.params.id) {
        db.query("SELECT * FROM `gallery` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!err && result.length > 0) {
                return _response.apiSuccess(res, result.length + " " + responsemsg.found, result)
            } else {
                return _response.apiWarning(res, responsemsg.listIsEmpty)
            }
        });
    } else {
        return _response.apiWarning(res, 'Please select id')
    }
}

function _delete(req, res) {
    if (req.params.id) {
        db.query("SELECT * FROM `gallery` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!result.length) {
                return _response.apiWarning(res, responsemsg.listIsEmpty)
            } else {
                db.query("DELETE FROM `gallery` WHERE id='" + req.params.id + "'", (err, result) => {
                    if (!err) {
                        return _response.apiSuccess(res, responsemsg.deleteSuccess)
                    } else {
                        return _response.apiFailed(res, err)
                    }
                });
            }

        });
    } else {
        return _response.apiWarning(res, 'Please select id')
    }
}
