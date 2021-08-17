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
    router.put('/transaction', update);
    router.get('/transaction/:uid', listById);
    router.put('/transaction-raw' , rawToraw)

    router.get('/balance-transfer-history/:uid', history1);
    router.get('/balance-convert-history/:uid', history2);
    router.get('/refer-income-history/:uid', history3);
    router.get('/joining-cost-history/:uid', history4);
    router.get('/daily-bonus-history/:uid', history5);


}

function history1(req,res){
    if (req.params.uid){

        db.query("SELECT * FROM `balance_transfer_history` WHERE from_id='"+req.params.uid+"'", (err, result) => {
            if (!err){
                return _response.apiSuccess(res, "Balance Transferred Successfully" ,result)
            }})
    }else {
        return  _response.apiWarning(res,"Insert uid")
    }
}

function history2(req,res){
    if (req.params.uid){

        db.query("SELECT * FROM `balance_convert_history` WHERE uid='"+req.params.uid+"'", (err, result) => {
            if (!err){
                return _response.apiSuccess(res, "Balance Transferred Successfully" ,result)
            }})
    }else {
        return  _response.apiWarning(res,"Insert uid")
    }
}

function history3(req,res){
    if (req.params.uid){

        db.query("SELECT * FROM `refer_income_history` WHERE uid='"+req.params.uid+"'", (err, result) => {
            if (!err){
                return _response.apiSuccess(res, "Balance Transferred Successfully" ,result)
            }})
    }else {
        return  _response.apiWarning(res,"Insert uid")
    }
}

function history4(req,res){
    if (req.params.uid){

        db.query("SELECT * FROM `joining_cost_history` WHERE uid='"+req.params.uid+"'", (err, result) => {
            if (!err){
                return _response.apiSuccess(res, "Balance Transferred Successfully" ,result)
            }})
    }else {
        return  _response.apiWarning(res,"Insert uid")
    }
}

function history5(req,res){
    if (req.params.uid){

        db.query("SELECT * FROM `daily_bonus_history` WHERE from_id='"+req.params.uid+"'", (err, result) => {
            if (!err){
                return _response.apiSuccess(res, "Balance Transferred Successfully" ,result)
            }})
    }else {
        return  _response.apiWarning(res,"Insert uid")
    }
}




function rawToraw (req,res){
    var formData = []
    let responseData = {}

    let from_uid = req.body.from_uid;
    let to_uid = req.body.to_uid;
    let transfer_amount = req.body.transfer_amount;

    db.query("SELECT * FROM `users` WHERE uid='"+req.body.from_uid+"'", (err, result) => {
        if (!err){
            let raw_cash = result[0].raw_cash
            if (parseInt(raw_cash) >= parseInt(transfer_amount)){
                let finalRaw_cash =  parseInt(raw_cash) - parseInt(transfer_amount)

                db.query("SELECT * FROM `users` WHERE uid='"+req.body.to_uid+"'", (err, result) => {
                    if (!err && result.length > 0) {
                        let raw_cash2 = result[0].raw_cash
                        db.query("UPDATE users SET ? WHERE uid = '"+req.body.from_uid+"'" , {raw_cash: finalRaw_cash} ,(err , result1) => {
                            if (!err) {

                                let inc = parseInt(raw_cash2) + parseInt(transfer_amount)

                                db.query("UPDATE users SET ? WHERE uid = '"+req.body.to_uid+"'" , {raw_cash: inc}, (err , result1) => {
                                    console.log(err)
                                    if (!err) {

                                        //Insert Transaction History
                                        db.query("INSERT INTO `balance_transfer_history` SET ?", {
                                            from_id: from_uid,
                                            to_id: to_uid,
                                            transfer_amount: transfer_amount
                                        }, (err, result) => {
                                        });

                                        responseData.transfer_amount = transfer_amount;
                                        responseData.from = from_uid
                                        responseData.to = to_uid;

                                        return _response.apiSuccess(res, "Balance Transferred Successfully" ,responseData)
                                    }
                                })


                            }
                        })

                    }else {
                        return  _response.apiWarning(res,"User not found")
                    }
                })



            }else {
                return  _response.apiWarning(res,"Low balance!")
            }
        }
    })
}


function listById(req ,res ){
    //const result = bcrypt.compareSync('123', hash);
    if (req.params.uid){
        db.query("SELECT * FROM `balance_convert_history` WHERE uid='"+req.params.uid+"' OR uid="+req.params.uid+"", (err, result) => {
            console.log(result)
            if (!err && result.length > 0) {
                return _response.apiSuccess(res, result.length+" "+responsemsg.found ,result)
            } else {
                return _response.apiWarning(res , responsemsg.listIsEmpty)
            }
        });
    }else {
        return _response.apiWarning(res , 'Please select id')
    }
}


function update(req ,res ){
    var formData = []

    if (req.body.uid){
        let responseData = {}
        db.query("SELECT * FROM `users` WHERE uid='"+req.body.uid+"'", (err, result) => {
            if (!err) {

                console.log(result[0].win_cash)
                let win_cash = result[0].win_cash;
                let raw_cash = result[0].raw_cash

                if (parseInt(req.body.amount) <= parseInt(win_cash)){

                    if (parseInt(req.body.amount) < 50){
                        return  _response.apiWarning(res,"Minimum balance required 50TK")
                    }else{


                        const result = ( (102/100) * parseInt(req.body.amount))
                        const result2 = ( (2/100) * parseInt(req.body.amount))

                        if (result <= win_cash){
                            let finalWinCash  = win_cash - result;
                            let finalRaw_cash = raw_cash + parseInt(req.body.amount);
                            db.query("UPDATE users SET ? WHERE uid = '"+req.body.uid+"'" , {win_cash: finalWinCash , raw_cash: finalRaw_cash} ,(err , result1) =>{
                                if (!err){

                                    responseData.charge = result2;
                                    responseData.transferred_amount = parseInt(req.body.amount)
                                    responseData.win_cash_decrement_amount = result;
                                    responseData.optional = result1

                                    db.query("INSERT INTO `balance_convert_history` SET ?", {
                                        uid: req.body.uid,
                                        amount: req.body.amount,
                                        charge: responseData.charge,
                                        total: result

                                    }, (err, result) => {
                                    });


                                    return _response.apiSuccess(res, "Balance Transferred Successfully" ,responseData)
                                }else{
                                    return _response.apiFailed(res, err)
                                }
                            })



                        }else {
                            return  _response.apiWarning(res,"Low balance!")
                        }

                    }

                }else {
                    return  _response.apiWarning(res,"Low balance!")
                }

            }else {
                return  _response.apiWarning(res,"Something went wrong!", err)
            }
        })


    }else {
        return  _response.apiWarning(res, 'Please select uid.')

    }
}
