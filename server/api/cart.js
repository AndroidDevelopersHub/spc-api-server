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
    router.get('/cart', list);
    router.post('/cart', add);
    router.put('/cart/', update);
    router.get('/cart/:user_id', details);
    router.delete('/cart/:id', _delete);
}


function add(req, res) {
    // >> Product Id  >> quantity avail ? ?? Ok -> Insert Price Update
    const schema = Joi.object({
        user_id: Joi.string().required(),
        product_id: Joi.string().required(),
        quantity: Joi.string().required(),
    });

    const {error} = schema.validate(req.body);
    if (error) return _response.apiFailed(res, error.details[0].message)


    let user_id = req.body.user_id;
    let product_id = req.body.product_id;
    let quantity = parseInt(req.body.quantity);

    db.query("SELECT * FROM product WHERE id =" + product_id + " ", (err, result) => {
        if (!err) {
            if (result.length > 0) {
                let stock = parseInt(result[0].stock);

                if (quantity === 0) {
                    return _response.apiWarning(res, "Minimum quantity required 1",{
                        cart_details: {
                        },

                        //cart_items: []
                    })
                }

                if (stock >= quantity) {

                    req.body.price = quantity * result[0].price

                    db.query("INSERT INTO cart SET ?", req.body, (err, result1) => {

                        db.query("SELECT SUM(price) AS total FROM cart WHERE user_id = "+user_id+"", (err , cartTotalResponse)=>{

                            db.query("SELECT * FROM cart WHERE user_id = "+user_id+"", (err , resultFinal)=>{

                                return _response.apiSuccess(res, "Cart added successfully", {

                                    cart_details: {
                                        total :cartTotalResponse[0].total,
                                        total_cart_item: resultFinal.length,
                                        updated_item_price: req.body.price,
                                        quantity: quantity
                                    },

                                    //cart_items: resultFinal

                                })

                            })

                        })



                    })


                } else {
                    return _response.apiWarning(res, "Out of stock")
                }

            } else {
                return _response.apiWarning(res, "Product is not available now")
            }
            //return _response.apiSuccess(res, responsemsg.saveSuccess , result)
        } else {
            return _response.apiFailed(res, err, result)
        }
    });

    // db.query("INSERT INTO cart SET ?", req.body , (err, result) => {
    //     if (!err) {
    //         return _response.apiSuccess(res, responsemsg.saveSuccess , result)
    //     } else {
    //         return _response.apiFailed(res, err , result)
    //     }
    // });


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


    db.query("SELECT COUNT(*) AS total FROM cart", (err, result) => {
        if (!err) {
            totalDocs = result[0].total
        } else {

        }
    });


    //Search by String
    if (req.query.search_string && req.query.search_string !== '') {

        db.query("SELECT * FROM cart WHERE CONCAT(title) REGEXP '" + req.query.search_string + "'  LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
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
        db.query("SELECT * FROM cart LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
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

    // >> Product Id  >> quantity avail ? ?? Ok -> Insert Price Update
    const schema = Joi.object({
        id: Joi.string().required(),
        quantity: Joi.string().required(),
    });

    const {error} = schema.validate(req.body);
    if (error) return _response.apiFailed(res, error.details[0].message)


    db.query("SELECT * FROM cart WHERE id = "+req.body.id+"", (err , result1)=>{

        if (result1.length  > 0){

            let product_id = result1[0].product_id;
            let quantity = parseInt(req.body.quantity);

            db.query("SELECT * FROM product WHERE id =" + product_id + " ", (err, result) => {
                if (!err) {
                    if (result.length > 0) {
                        let stock = parseInt(result[0].stock);

                        if (quantity === 0) {
                            return _response.apiWarning(res, "Minimum quantity required 1",{
                                cart_details: {
                                },

                               // cart_items: []
                            })
                        }

                        if (stock >= quantity) {

                            req.body.price = quantity * result[0].price

                            db.query("UPDATE cart SET ? WHERE id = "+result1[0].id+" ", req.body, (err, result2) => {


                                db.query("SELECT SUM(price) AS total FROM cart WHERE user_id = "+result1[0].user_id+"", (err , cartTotalResponse)=>{
                                    db.query("SELECT * FROM cart WHERE user_id = "+result1[0].user_id+"", (err , resultFinal)=>{
                                        return _response.apiSuccess(res, "Cart update successfully", {
                                            cart_details: {
                                                total :cartTotalResponse[0].total,
                                                total_cart_item: resultFinal.length,
                                                updated_item_price: req.body.price,
                                                quantity: quantity
                                            },
                                           // cart_items: resultFinal

                                        })
                                    })
                                })

                            })


                        } else {
                            return _response.apiWarning(res, "Out of stock")
                        }

                    } else {
                        return _response.apiWarning(res, "Product is not available now")
                    }
                    //return _response.apiSuccess(res, responsemsg.saveSuccess , result)
                } else {
                    return _response.apiFailed(res, err, result)
                }
            });



        }else {
            return _response.apiWarning(res , "Cart Not found")
        }

    })

/*
    if (req.params.id) {
        db.query("SELECT * FROM `cart` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!err && result.length > 0) {

                db.query("UPDATE cart SET ? WHERE id = '" + req.params.id + "'", req.body, (err, result) => {
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

    }*/
}

function details(req, res) {
    //const result = bcrypt.compareSync('123', hash);
    if (req.params.user_id) {
        db.query("SELECT SUM(price) AS total FROM cart WHERE user_id = "+req.params.user_id+"", (err , cartTotalResponse)=>{

            if (cartTotalResponse[0].total === null){
                return _response.apiWarning(res,"Cart not Found", {})
            }

            db.query("SELECT * FROM cart WHERE user_id = "+req.params.user_id+"", (err , resultFinal)=>{

                db.query("SELECT * FROM cart INNER JOIN product ON cart.product_id = product.id WHERE user_id = "+req.params.user_id+"", (err , resultFinal1)=>{

                    return _response.apiSuccess(res, "Cart Found", {
                        cart_details: {
                            total : cartTotalResponse[0].total,
                            total_cart_item: resultFinal.length,
                            updated_item_price: 0,
                            quantity: resultFinal[0].quantity,

                        },
                        cart_items: resultFinal1

                    })

                })

            })

        })
    } else {
        return _response.apiWarning(res, 'Please select id')
    }
}

function _delete(req, res) {

    if (req.params.id) {
        db.query("SELECT * FROM `cart` WHERE id='" + req.params.id + "'", (err, result) => {
            if (!result.length) {
                return _response.apiWarning(res, responsemsg.listIsEmpty)
            } else {
                db.query("DELETE FROM `cart` WHERE id='" + req.params.id + "'", (err, result) => {
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
