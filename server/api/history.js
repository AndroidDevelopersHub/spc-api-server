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
    router.get('/placement/:id', list);
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

async function list(req, response) {

    let dataX = []

    db.query("SELECT uid,username FROM users WHERE placement_id = '" + req.params.id + "'", (err, result1) => {
        if (!err) {

            let responseData = {}

            placementTree(req, req.params.id, "a",function (result) {
                dataX.push(result)
                if (result1[0].uid !== undefined){

                    placementTree(req, result1[0].uid, "b",function (result) {
                        dataX.push(result)
                        if (result1[1].uid !== undefined){

                            placementTree(req, result1[1].uid, "c",function (result) {
                                dataX.push(result)
                                if (result1[1].uid !== undefined){


                                    placementTree(req, result1[2].uid, "d",function (result) {
                                        dataX.push(result)
                                        if (result1[2].uid !== undefined){
                                            return _response.apiSuccess(response,"",dataX)
                                        }else {
                                            return _response.apiSuccess(response,"",dataX)
                                        }
                                    })

                                }else {
                                    return _response.apiSuccess(response,"",dataX)
                                }
                            })

                        }else {
                            return _response.apiSuccess(response,"",dataX)
                        }
                    })

                }else {
                    return _response.apiSuccess(response,"",dataX)
                }
            })



        }
    })
    //



}


function placementTree(req, id ,name, callback) {
    db.query("SELECT uid,username FROM users WHERE placement_id = '" + id + "'", (err, result1) => {
        if (!err) {
            let responseData = {}
            //responseData.tree_one = result1


            let query1 = ""
            let query2 = ""
            let query3 = ""

            if (result1[0] !== undefined) query1 = "select uid,username,placement_id from (select * from users order by placement_id, uid) products_sorted, (select @pv := '" + result1[0].uid + "') initialisation where   find_in_set(placement_id, @pv) and     length(@pv := concat(@pv, ',', uid))"
            if (result1[1] !== undefined) query2 = "select uid,username,placement_id from (select * from users order by placement_id, uid) products_sorted, (select @pv := '" + result1[1].uid + "') initialisation where   find_in_set(placement_id, @pv) and     length(@pv := concat(@pv, ',', uid))"
            if (result1[2] !== undefined) query3 = "select uid,username,placement_id from (select * from users order by placement_id, uid) products_sorted, (select @pv := '" + result1[2].uid + "') initialisation where   find_in_set(placement_id, @pv) and     length(@pv := concat(@pv, ',', uid))"
            if (query1 !== "") {
                db.query(query1, (err, result) => {
                    if (!err) {
                        responseData[name] = {}
                        responseData[name].one = result.length
                        if (query2 !== "") {
                            db.query(query2, (err, result) => {
                                if (!err) {
                                    responseData[name].two = result.length
                                    if (query1 !== "") {
                                        db.query(query3, (err, result) => {
                                            if (!err) {
                                                responseData[name].three = result.length
                                                //return _response.apiSuccess(res, " " + responsemsg.found, responseData)
                                                return callback(responseData)

                                            }
                                        })
                                    } else {
                                        return callback(responseData)
                                        //return _response.apiSuccess(res,   " " + responsemsg.found, responseData);
                                    }
                                }
                            })
                        } else {
                            // return _response.apiSuccess(res,   " " + responsemsg.found, responseData);
                            return callback(responseData)
                        }
                    }
                })
            } else {

                return callback(responseData)
            }
        } else {
            return _response.apiFailed(res, responsemsg.listIsEmpty)
        }
    });
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
