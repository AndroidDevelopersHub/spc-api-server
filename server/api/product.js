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


module.exports = function (router) {
    router.get('/product', list);
    router.post('/product', add);
    router.put('/product/:id', update);
    router.get('/product/:id', details);
    router.delete('/product/:id', _delete);
}


function add(req, res) {
    //

    // const { error } = schema.validate(req.body);
    // if (error) return _response.apiFailed(res ,error.details[0].message)

    console.log('User not exist')
    db.query("INSERT INTO product SET ?", req.body, (err, result) => {
        if (!err) {
            return _response.apiSuccess(res, responsemsg.saveSuccess, result)
        } else {
            return _response.apiFailed(res, err, result)
        }
    });


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


    db.query("SELECT COUNT(*) AS total FROM product", (err, result) => {
        if (!err) {
            totalDocs = result[0].total
        } else {

        }
    });


    //Search by String
    if (req.query.search_string && req.query.search_string !== '') {

        db.query("SELECT * FROM product WHERE CONCAT(title) REGEXP '" + req.query.search_string + "'  LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
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
        db.query("SELECT * FROM `product`  LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
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
        db.query("SELECT * FROM `product` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!err && result.length > 0) {

                db.query("UPDATE product SET ? WHERE id = '" + req.params.id + "'", req.body, (err, result) => {
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

async function details(req, res) {
    let responseData = {}
    //const result = bcrypt.compareSync('123', hash);
    if (req.params.id) {
        await db.query("SELECT * FROM `product` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!err && result.length > 0) {
                responseData.product_details = result;
                if (responseData.product_details[0].image_id !== null) {
                    db.query("SELECT * FROM `gallery` WHERE g_id='" + responseData.product_details[0].image_id + "'", (err1, result1)  => {
                        responseData.images = result1
                        console.log(result1)
                        return _response.apiSuccess(res, result.length + " " + responsemsg.found, responseData)
                    })
                } else {
                    return _response.apiSuccess(res, result.length + " " + responsemsg.found, responseData)
                }
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
        db.query("SELECT * FROM `product` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!result.length) {
                return _response.apiWarning(res, responsemsg.listIsEmpty)
            } else {
                db.query("DELETE FROM `product` WHERE id='" + req.params.id + "'", (err, result) => {
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
