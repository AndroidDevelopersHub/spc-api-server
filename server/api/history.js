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
    router.get('/history/:id', details);
    router.get('/placement/:id', list);
}

async function list(req, response) {
    let dataX = [


    ]
    let user_data = []
    let responseData = {
        //tree: dataX,
        user_data
    }


    db.query("SELECT uid,username,parent_refer , refer, createdAt FROM users WHERE uid = '" + req.params.id + "'", (err, result3) => {
        if (!err) {
            if (result3.length >= 0) {
                let userData = {...result3[0] , ...{one: 0 , two: 0, three:0}}
                user_data.push(userData)

                db.query("SELECT uid,username,parent_refer,team_position , refer, createdAt FROM users WHERE placement_id = '" + req.params.id + "'", (err, result1) => {
                    if (!err) {


                        for (var i = 0; i < result1.length; i++) {
                            let userData = {...result1[i] , ...{one: 0 , two: 0, three:0}}
                            //user_data.push(result1[i])
                            user_data.push(userData)
                        }
                        responseData.user_data = user_data


                        placementTree(req, req.params.id, result1[0].team_position.toLowerCase(), function (result) {

                            console.log(result)

                            if (result1.length > 0) {
                                dataX.push(result)
                               // console.log("::::::",dataX)
                               // console.log(result)
                                 /*   switch (result1[0].team_position){
                                        case 'A':
                                            responseData.user_data[0] = {...responseData.user_data[0] , ...{one: dataX[0].a.one}}
                                            break;
                                        case 'B':
                                            responseData.user_data[0] = {...responseData.user_data[0] , ...{one: dataX[0].b.one, two: dataX[0].b.two, three: dataX[0].b.three }}
                                            break;
                                        case 'C':
                                            responseData.user_data[0] = {...responseData.user_data[0] , ...{three: dataX[0].c.one}}
                                            break;

                                    }*/


                                responseData.user_data[0] = {...responseData.user_data[0] , ...dataX[0].b}

                                if (result1[0].uid) {
                                    if (result1[0].uid !== undefined) {
                                        placementTree(req, result1[0].uid, "b", function (result) {
                                            dataX.push(result)

                                            /*for (var i=0; i<result1.length; i++){
                                                switch (result1[i].team_position){
                                                    case 'A':
                                                        responseData.user_data[1] = {...responseData.user_data[1] , ...{one: dataX[1].b.one}}
                                                        break;
                                                    case 'B':
                                                        responseData.user_data[1] = {...responseData.user_data[1] , ...{two: dataX[1].b.one}}
                                                        break;
                                                    case 'C':
                                                        responseData.user_data[1] = {...responseData.user_data[1] , ...{three: dataX[1].b.one}}
                                                        break;

                                                }
                                            }*/

                                            responseData.user_data[1] = {...responseData.user_data[1] , ...dataX[1].b}
                                            if (result1.length > 1) {
                                                placementTree(req, result1[1].uid, "c", function (result) {
                                                    dataX.push(result)
                                                    responseData.user_data[2] = {...responseData.user_data[2] , ...dataX[2].c}
                                                    if (result1.length > 2) {
                                                        placementTree(req, result1[2].uid, "d", function (result) {
                                                            dataX.push(result)
                                                            responseData.user_data[3] = {...responseData.user_data[3] , ...dataX[3].d}
                                                            if (result1[2].uid !== undefined) {
                                                                return _response.apiSuccess(response, "", responseData)
                                                            } else {
                                                                return _response.apiSuccess(response, "", responseData)
                                                            }
                                                        })

                                                    } else {
                                                        return _response.apiSuccess(response, "", responseData)
                                                    }
                                                })

                                            } else {
                                                return _response.apiSuccess(response, "", responseData)
                                            }
                                        })
                                    } else {
                                        return _response.apiSuccess(response, "", responseData)
                                    }
                                }
                            } else {
                                if (responseData.user_data === [null]) {
                                    responseData.user_data = []
                                }

                                return _response.apiSuccess(response, "", responseData)
                            }


                        })


                    }
                })
                //
            }
        }
    })

}

function placementTree(req, id, name, callback) {
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
                        responseData[name].one = result.length + 1
                        if (query2 !== "") {
                            db.query(query2, (err, result) => {
                                if (!err) {
                                    responseData[name].two = result.length + 1
                                    if (query3 !== "") {
                                        db.query(query3, (err, result) => {
                                            if (!err) {
                                                responseData[name].three = result.length + 1
                                                //return _response.apiSuccess(res, " " + responsemsg.found, responseData)
                                                return callback(responseData)

                                            } else {
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
                    } else {
                        return callback(responseData)
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

function details(req, res) {
    //const result = bcrypt.compareSync('123', hash);
    let responseData = {}
    if (req.params.id) {

        db.query("SELECT SUM(value) AS total_daily_bonus FROM daily_bonus_history WHERE uid = '" + req.params.id + "'", (err, result1) => {
            if (!err) {
                db.query("SELECT SUM(value) AS total_refer_income FROM refer_income_history WHERE uid = '" + req.params.id + "'", (err, result2) => {

                    db.query("SELECT SUM(total) AS total_expense_by_order FROM orders WHERE user_id = '" + req.params.id + "'", (err, result3) => {

                        db.query("SELECT SUM(amount) AS total_withdraw FROM withdraw_request WHERE uid = '" + req.params.id + "' AND status = " + 1 + " ", (err, result4) => {

                            db.query("SELECT SUM(raw_cash) AS current_raw_balance FROM users WHERE uid = '" + req.params.id + "'", (err, result5) => {

                                db.query("SELECT SUM(value) AS total_joining_cost FROM joining_cost_history WHERE uid = '" + req.params.id + "'", (err, result6) => {

                                    db.query("SELECT SUM(transfer_amount) AS total_transfer_balance FROM balance_transfer_history WHERE from_id = '" + req.params.id + "'", (err, result7) => {

                                        db.query("SELECT SUM(amount) AS total_convert_balance FROM balance_convert_history WHERE uid = '" + req.params.id + "'", (err, result8) => {


                                            if (result1[0].total_daily_bonus !== null) responseData.total_daily_bonus = result1[0].total_daily_bonus; else responseData.total_daily_bonus = 0
                                            if (result2[0].total_refer_income !== null) responseData.total_refer_income = result2[0].total_refer_income; else responseData.total_refer_income = 0
                                            if (result3[0].total_expense_by_order !== null) responseData.total_expense_by_order = result3[0].total_expense_by_order; else responseData.total_expense_by_order = 0
                                            if (result4[0].total_withdraw !== null) responseData.total_expense_by_withdraw = result4[0].total_withdraw; else responseData.total_withdraw = 0
                                            responseData.total_income = parseInt(responseData.total_daily_bonus) + parseInt(responseData.total_refer_income)
                                            responseData.total_expense = parseInt(responseData.total_expense_by_order) + parseInt(responseData.total_withdraw) + parseInt(responseData.total_joining_cost)
                                            if (result5[0].current_raw_balance) responseData.current_raw_balance = result5[0].current_raw_balance; else responseData.current_raw_balance = 0
                                            if (result6[0].total_joining_cost !== null) responseData.total_joining_cost = result6[0].total_joining_cost; else responseData.total_joining_cost = 0
                                            if (result7[0].total_transfer_balance !== null) responseData.total_transfer_balance = result7[0].total_transfer_balance; else responseData.total_transfer_balance = 0
                                            if (result8[0].total_convert_balance !== null) responseData.total_convert_balance = result8[0].total_convert_balance; else responseData.total_convert_balance = 0


                                            return _response.apiSuccess(res, responsemsg.found, responseData)
                                        })
                                    })



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

