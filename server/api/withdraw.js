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
    router.get('/withdraw-request', list);
    router.post('/withdraw-request', add);
    router.put('/withdraw-request/:id', update);
    router.get('/withdraw-request/:id', details);
    router.delete('/withdraw-request/:id', _delete);
}


function add(req, res) {
    //
    // const { error } = schema.validate(req.body);
    // if (error) return _response.apiFailed(res ,error.details[0].message)

    let user_id = req.body.uid
    db.query("SELECT * FROM `users` WHERE uid = '" + user_id + "' ", (err, result00) => {
        if (result00.length > 0) {
            let myWinCash = parseInt(result00[0].win_cash);
            let myRawCash = parseInt(result00[0].raw_cash);
            let aa = myWinCash + myRawCash;
            let total = req.body.amount;


            if (total != null && parseInt(aa) < parseInt(total)) {
                return _response.apiWarning(res, "Low balance!")
            } else {

                if (myWinCash >= total) {
                    console.log("----------1")
                    console.log(myWinCash - total)

                    db.query("UPDATE users SET ? WHERE uid = '" + user_id + "'", {
                        win_cash: myWinCash - total
                    }, (err22, result11) => {
                        if (!err22) {
                            //TODO:
                            db.query("INSERT INTO withdraw_request SET ?", req.body, (err, result) => {
                                if (!err) {
                                    return _response.apiSuccess(res, responsemsg.saveSuccess, result)
                                } else {
                                    return _response.apiFailed(res, err, result)
                                }
                            });
                        }
                    })

                } else if ((myWinCash + myRawCash) > total) {
                    console.log("----------2")

                    let a = total - myWinCash
                    let b = myRawCash - a;

                    db.query("UPDATE users SET ? WHERE uid = '" + user_id + "'", {
                        win_cash: 0,
                        raw_cash: b
                    }, (err11, result11) => {

                        if (!err11) {
                            //TODO:
                            db.query("INSERT INTO withdraw_request SET ?", req.body, (err, result) => {
                                if (!err) {
                                    return _response.apiSuccess(res, responsemsg.saveSuccess, result)
                                } else {
                                    return _response.apiFailed(res, err, result)
                                }
                            });
                        }
                    })

                } else {
                    console.log("----------3")
                    return _response.apiWarning(res, "Low balance!")
                }

            }


        } else {
            return _response.apiWarning(res, "User not found")
        }
    })


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


    db.query("SELECT COUNT(*) AS total FROM withdraw_request", (err, result) => {
        if (!err) {
            totalDocs = result[0].total
        } else {

        }
    });


    //Search by String
    if (req.query.search_string && req.query.search_string !== '') {

        db.query("SELECT w.id,w.amount, w.payment_method, w.uid,w.account_number ,w.payment_settings_id, w.status ,w.createdAt , u.username , u.phone FROM `withdraw_request` AS w INNER JOIN `users` AS u ON u.uid = w.uid WHERE CONCAT(title) REGEXP '" + req.query.search_string + "'  LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
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
        db.query("SELECT w.id,w.amount, w.payment_method, w.uid,w.account_number ,w.payment_settings_id, w.status ,w.createdAt , u.username , u.phone FROM `withdraw_request` AS w INNER JOIN `users` AS u ON u.uid = w.uid LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
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
        db.query("SELECT * FROM `withdraw_request` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!err && result.length > 0) {

                db.query("UPDATE withdraw_request SET ? WHERE id = '" + req.params.id + "'", req.body, (err, result) => {
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
        db.query("SELECT * FROM `withdraw_request` WHERE id='" + req.params.id + "'", (err, result) => {
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
        db.query("SELECT * FROM `withdraw_request` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!result.length) {
                return _response.apiWarning(res, responsemsg.listIsEmpty)
            } else {
                db.query("DELETE FROM `withdraw_request` WHERE id='" + req.params.id + "'", (err, result) => {
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
