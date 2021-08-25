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
    router.get('/placement/:id', list);

}


async function list(req, res) {

    let dataX = []
    let user_data = []
    let responseData = {
        tree:dataX,
        user_data
    }

    db.query("SELECT uid,username,parent_refer , refer, createdAt FROM users WHERE uid = '" + req.params.id + "'", (err, result3) => {
        if (!err) {
            if (result3.length >= 0){
                user_data.push(result3[0])

                db.query("SELECT uid,username,parent_refer , refer, createdAt FROM users WHERE placement_id = '" + req.params.id + "'", (err, result1) => {
                    if (!err) {

                        for(var i=0; i<result1.length; i++){
                            user_data.push(result1[i])
                        }
                        responseData.user_data = user_data

                        placementTree(req, req.params.id, "a", function (result) {
                            dataX.push(result)


                            if (result1[0].uid !== undefined) {
                                placementTree(req, result1[0].uid, "b", function (result) {
                                    dataX.push(result)
                                    if (result1[1].uid !== undefined) {

                                        placementTree(req, result1[1].uid, "c", function (result) {
                                            dataX.push(result)
                                            if (result1[2].uid !== undefined) {
                                                placementTree(req, result1[2].uid, "d", function (result) {
                                                    dataX.push(result)
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


                        })


                    }
                })
                //
            }
        }})


}

function placementTree(req, id, name, callback) {
    db.query("SELECT uid,username FROM users WHERE placement_id = '" + id + "'", (err, result1) => {
        if (!err) {
            let responseData = {}
            //responseData.tree_one = result1


            let query1 = ""
            let query2 = ""
            let query3 = ""

            if (result1[0] !== undefined) query1 = "select uid,username,placement_id from (select * from users order by placement_id, uid WHERE team_position = 'A') products_sorted, (select @pv := '" + result1[0].uid + "') initialisation where   find_in_set(placement_id, @pv) and     length(@pv := concat(@pv, ',', uid))"
            if (result1[1] !== undefined) query2 = "select uid,username,placement_id from (select * from users order by placement_id, uid WHERE team_position = 'B') products_sorted, (select @pv := '" + result1[1].uid + "') initialisation where   find_in_set(placement_id, @pv) and     length(@pv := concat(@pv, ',', uid))"
            if (result1[2] !== undefined) query3 = "select uid,username,placement_id from (select * from users order by placement_id, uid WHERE team_position = 'C') products_sorted, (select @pv := '" + result1[2].uid + "') initialisation where   find_in_set(placement_id, @pv) and     length(@pv := concat(@pv, ',', uid))"
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

                                            }else {
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
                    }else {
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

