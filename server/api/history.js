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
    /*router.get('/history', list);
    router.post('/slider', add);
    router.put('/slider/:id', update);*/
    router.get('/history/:id', details);
    /*router.delete('/slider/:id', _delete);*/
}


function add(req, res) {
    //

    // const { error } = schema.validate(req.body);
    // if (error) return _response.apiFailed(res ,error.details[0].message)

    console.log('User not exist')
    db.query("INSERT INTO slider SET ?", req.body, (err, result) => {
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


    db.query("SELECT COUNT(*) AS total FROM slider", (err, result) => {
        if (!err) {
            totalDocs = result[0].total
        } else {

        }
    });


    //Search by String
    if (req.query.search_string && req.query.search_string !== '') {

        db.query("SELECT * FROM slider WHERE CONCAT(title) REGEXP '" + req.query.search_string + "'  LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
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
        db.query("SELECT * FROM slider LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
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
        db.query("SELECT * FROM `slider` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!err && result.length > 0) {

                db.query("UPDATE slider SET ? WHERE id = '" + req.params.id + "'", req.body, (err, result) => {
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
    let responseData = {}
    if (req.params.id) {

        db.query("SELECT SUM(value) AS total_daily_bonus FROM daily_bonus_history WHERE uid = '" + req.params.id + "'", (err, result1) => {
            if (!err) {
                db.query("SELECT SUM(value) AS total_refer_income FROM refer_income_history WHERE uid = '" + req.params.id + "'", (err, result2) => {

                    db.query("SELECT SUM(value) AS total_expense_by_order FROM orders WHERE uid = '" + req.params.id + "'", (err, result3) => {

                        db.query("SELECT SUM(amount) AS total_withdraw FROM withdraw_request WHERE uid = '" + req.params.id + "' AND status = " + 1 + " ", (err, result4) => {

                            db.query("SELECT SUM(raw_cash) AS current_raw_balance FROM users WHERE uid = '" + req.params.id + "'", (err, result5) => {

                                db.query("SELECT SUM(value) AS total_joining_cost FROM joining_cost_history WHERE uid = '" + req.params.id + "'", (err, result6) => {

                                    if (result1) responseData.total_daily_bonus = result1[0].total_daily_bonus; else responseData.total_daily_bonus = 0
                                    if (result2) responseData.total_refer_income = result2[0].total_refer_income; else responseData.total_refer_income = 0
                                    if (result3) responseData.total_expense_by_order = result3[0].total_expense_by_order; else responseData.total_expense_by_order = 0
                                    if (result4) responseData.total_expense_by_withdraw = result4[0].total_withdraw; else responseData.total_withdraw = 0
                                    responseData.total_income = parseInt(responseData.total_daily_bonus) + parseInt(responseData.total_refer_income)
                                    responseData.total_expense = parseInt(responseData.total_expense_by_order) + parseInt(responseData.total_expense_by_withdraw)
                                    if (result5) responseData.current_raw_balance = result5[0].current_raw_balance; else responseData.current_raw_balance = 0
                                    if (result6) responseData.total_joining_cost = result6[0].total_joining_cost; else responseData.total_joining_cost = 0



                                    return _response.apiSuccess(res, responsemsg.found, responseData)

                                })


                            })


                        })


                    })


                })
            } else {
                return _response.apiWarning(res, err)
            }

        })

    } else {
        return _response.apiWarning(res, 'Please select id')
    }
}


function _delete(req, res) {

    if (req.params.id) {
        db.query("SELECT * FROM `slider` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!result.length) {
                return _response.apiWarning(res, responsemsg.listIsEmpty)
            } else {
                db.query("DELETE FROM `slider` WHERE id='" + req.params.id + "'", (err, result) => {
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