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
const moment = require("moment")


module.exports = function (router) {
    router.get('/daily-task', list);
    router.post('/daily-task', add);
    router.put('/daily-task/:id', update);
    router.put('/daily-task-update', updateAll);
    router.get('/daily-task/:id', details);
    router.delete('/daily-task/:id', _delete);
    router.post('/daily-task-complete', taskComplete);
}


function taskComplete(req, res) {

    console.log(moment().format("YYYY-MM-DD"))
    db.query("SELECT * FROM daily_task WHERE id= " + req.body.task_id + " AND createdAt >='" + moment().format("YYYY-MM-DD") + "' AND createdAt <'" + moment().format("YYYY-MM-DD") + " 23:59:59'  ", (err, resultBase) => {
        console.log(resultBase.length)
        console.log(resultBase)
        if (resultBase.length <= 0) {
            console.log("empty")
            return _response.apiWarning(res, "Task time is over")
        } else {
            console.log("not empty")
            db.query("SELECT * FROM daily_task_complete WHERE task_id= " + req.body.task_id + " AND uid= " + req.body.uid + "  AND createdAt >='" + moment().format("YYYY-MM-DD") + "' AND createdAt <'" + moment().format("YYYY-MM-DD") + " 23:59:59' ", (err, result1) => {
                console.log(result1)
                if (result1.length <= 0) {
                    db.query("INSERT INTO daily_task_complete SET ?", req.body, (err, result) => {
                        if (!err) {

                            db.query("SELECT * FROM daily_task WHERE id= " + req.body.task_id + " ", (err, result2) => {
                                console.log(result2[0].point)
                                if (result2.length >= 0) {
                                    db.query("SELECT * FROM `users` WHERE uid='" + req.body.uid + "'", (err, result3) => {

                                        if (result3.length > 0) {
                                            let sum = result2[0].point + result3[0].win_cash;

                                            db.query("UPDATE users SET win_cash = " + sum + " WHERE uid = " + req.body.uid + " ", (err, resultFinal) => {

                                                db.query("INSERT INTO `daily_bonus_history` SET ?", {uid: req.body.uid , value: result2[0].point} , (err, result) => {
                                                    if (!err) {
                                                        return _response.apiSuccess(res, "Task Complete")
                                                    } else {
                                                        return _response.apiSuccess(res, "Task Complete")
                                                    }
                                                });
                                            })
                                        } else {
                                            return _response.apiWarning(res, "User not found")
                                        }
                                    })

                                } else {
                                    return _response.apiWarning(res, "Point is not available")
                                }
                            })
                            //return _response.apiSuccess(res, responsemsg.saveSuccess , result)
                        } else {
                            return _response.apiFailed(res, err, result)
                        }
                    });
                } else {
                    return _response.apiWarning(res, "Task Already complete")
                }
            })

        }
    })

}

function add(req, res) {
    //
    // const { error } = schema.validate(req.body);
    // if (error) return _response.apiFailed(res ,error.details[0].message)

    console.log('User not exist')
    db.query("INSERT INTO daily_task SET ?", req.body, (err, result) => {
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


    db.query("SELECT COUNT(*) AS total FROM daily_task ", (err, result) => {
        if (!err) {
            totalDocs = result[0].total
        } else {

        }
    });


    //Search by String
    if (req.query.search_string && req.query.search_string !== '') {

        db.query("SELECT * FROM daily_task WHERE CONCAT(title) REGEXP '" + req.query.search_string + "' AND createdAt >='" + moment().format("YYYY-MM-DD") + "' AND createdAt <'" + moment().format("YYYY-MM-DD") + " 23:59:59'   LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
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
        db.query("SELECT * FROM daily_task WHERE createdAt >='" + moment().format("YYYY-MM-DD") + "' AND createdAt <'" + moment().format("YYYY-MM-DD") + " 23:59:59'  LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
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
        db.query("SELECT * FROM `daily_task` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!err && result.length > 0) {

                db.query("UPDATE daily_task SET ? WHERE id = '" + req.params.id + "'", req.body, (err, result) => {
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

function updateAll(req, res) {
    db.query("UPDATE daily_task SET ? ", {createdAt: new Date()} ,(err , result) =>{
        if (!err){
            console.log("Ok")
            return _response.apiSuccess(res, responsemsg.updateSuccess)
        }else{
            console.log("Not Ok")
            return _response.apiFailed(res, err)
        }
    })
}

function details(req, res) {
    //const result = bcrypt.compareSync('123', hash);
    if (req.params.id) {
        db.query("SELECT * FROM `daily_task` WHERE id='" + req.params.id + "'", (err, result) => {
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
        db.query("SELECT * FROM `daily_task` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!result.length) {
                return _response.apiWarning(res, responsemsg.listIsEmpty)
            } else {
                db.query("DELETE FROM `daily_task` WHERE id='" + req.params.id + "'", (err, result) => {
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
