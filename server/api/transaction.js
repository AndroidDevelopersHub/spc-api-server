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

                    const result = ( (102/100) * parseInt(req.body.amount)).toFixed(2)
                    const result2 = ( (2/100) * parseInt(req.body.amount)).toFixed(2)

                    if (result <= win_cash){
                        let finalWinCash  = win_cash - result;
                        let finalRaw_cash = raw_cash + parseInt(req.body.amount);
                        db.query("UPDATE users SET ? WHERE uid = '"+req.body.uid+"'" , {win_cash: finalWinCash , raw_cash: finalRaw_cash} ,(err , result1) =>{
                            if (!err){

                                responseData.charge = result2;
                                responseData.transferred_amount = req.body.amount
                                responseData.win_cash_decrement_amount = result;
                                responseData.optional = result1

                                return _response.apiSuccess(res, "Balance Transferred Successfully" ,responseData)
                            }else{
                                return _response.apiFailed(res, err)
                            }
                        })



                    }else {
                        return  _response.apiWarning(res,"Low balance!")
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
