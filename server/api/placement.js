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

