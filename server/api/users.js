const express = require("express");
const db = require("./db");
const router = express.Router();
let jwt = require("jsonwebtoken");
const config = require("../../middleware/config.json"); // refresh
let tokenChecker = require("../../middleware/tockenchecker");
const tokenList = {};
const _response = require('../common/middleware/api-response')
const responsemsg = require('../common/middleware/response-msg')
const commonStrings = require('../common/middleware/common-strings')
const responsecode = require('../common/middleware/response-code')
const response = require('../common/middleware/api-response')
const Joi = require('@hapi/joi')
const bcrypt = require('bcrypt');
const commonServe = require('../common/services/commonServices')
const validateAuthUser = require('../common/middleware/validateAuthorizeUser')


module.exports = function (router) {
    router.get('/users', validateAuthUser, list);
    router.put('/users/:id', validateAuthUser, update);
    router.get('/users/:id', validateAuthUser, details);
    router.delete('/users/:id', validateAuthUser, _delete);

    //
    router.post('/users/login', login);
    router.post('/users', registration);
}

const schema = Joi.object({
    username: Joi.string().min(6).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(11).required(),
    salt: Joi.string().required(),
    //token: Joi.string().required()
});


function test() {
    //123456
    let password = "123456";
    let salt = bcrypt.hashSync(password.toString(), bcrypt.genSaltSync(10));
    console.log(salt)
}

async function login(req, res) {
    let responseData = {}
    let email = req.body.email.toLowerCase();
    let password = req.body.password;

    await db.query("SELECT * FROM `users` WHERE email = '" + email + "'", (err, result1) => {
        if (!err) {
            if (result1.length > 0) {
                bcrypt.compare(password, result1[0].salt).then(function (result) {
                    // result == true
                    console.log(result)
                    if (result === true) {
                        let token = jwt.sign({user: result[0]}, config.secret, {
                            expiresIn: 186400 // expires in 24 hours
                        });
                        responseData.result = result1
                        responseData.token = token
                        return _response.apiSuccess(res, responsemsg.found, responseData)
                    } else {
                        return _response.apiFailed(res, err, result)
                    }
                });
            } else {
                return _response.apiFailed(res, err, result)
            }
        } else {
            return _response.apiFailed(res, err, result)
        }
    })

}


async function registration(req, res) {
    //

    let referCashArray = [50,45,40,35,30,28,25,22,20,17,15,12,10,8,6,4,2]

    let responseData = {}
    let username = req.body.username;
    let email = req.body.email.toLowerCase();
    let phone = req.body.phone;
    //let salt =  bcrypt.hashSync(req.body.password.toString(),  bcrypt.genSaltSync(10));

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(req.body.salt, salt);
    req.body.salt = hash
    req.body.hash = salt


    /*const { error } = schema.validate(req.body);
    if (error) return _response.apiFailed(res ,error.details[0].message)*/


    db.query("SELECT * FROM `users` WHERE email = '" + email + "' OR phone = '" + phone + "'  OR username = '" + username + "' ", (err, result) => {
        if (!result.length) {
            console.log('User not exist')
            db.query("INSERT INTO users SET ?", req.body, (err, result) => {
                if (!err) {

                    return _response.apiSuccess(res, responsemsg.saveSuccess, {
                        result: result,
                    })
                    /*
                    var nextRefer = req.body.parent_refer;
                    var level = 20;
                    if (nextRefer !== "") {
                        db.query("SELECT * FROM `users` WHERE username = '" + nextRefer + "' ", (err, result) => {
                            console.log("000000", result)
                            if (result.length >= 0){

                                let refer = result[0].win_cash;
                                db.query("UPDATE  `users` SET win_cash='"+refer+"'  WHERE username ='"+refer+"' ")

                            }else {
                                return _response.apiSuccess(res, responsemsg.userSaveSuccess, result)
                            }

                        })
                    } else {
                        return _response.apiSuccess(res, responsemsg.saveSuccess, {
                            result: result,
                        })
                    }*/

                    /*let token = jwt.sign({ user: result[0] }, config.secret, {
                        expiresIn: 86400 // expires in 24 hours
                    });*/
                   // return _response.apiSuccess(res, responsemsg.userSaveSuccess, result)
                } else {
                    return _response.apiFailed(res, err, result)
                }
            });

        } else {
            return _response.apiWarning(res, responsemsg.userAlreadyExist)
        }
    })


}


async function list(req, res) {

    let limit = 500;
    let page = 1;
    let totalDocs = 0;
    if (req.query.page) {
        page = req.query.page
    }
    if (req.query.limit) {
        limit = req.query.limit
    }
    let offset = (page - 1) * limit


    db.query("SELECT COUNT(*) AS total FROM users", (err, result) => {
        if (!err) {
            totalDocs = result[0].total
        } else {

        }
    });


    //Search by String
    if (req.query.search_string && req.query.search_string !== '') {

        db.query("SELECT * FROM users WHERE CONCAT(name, email,phone) REGEXP '" + req.query.search_string + "'  LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
            if (!err && result.length > 0) {
                return _response.apiSuccess(res, result.length + " " + responsemsg.redeemFound, result, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalDocs: totalDocs
                })

            } else {
                return _response.apiFailed(res, responsemsg.userListIsEmpty)
            }
        });


    } else {
        db.query("SELECT * FROM users LIMIT " + limit + " OFFSET " + offset + " ", (err, result) => {
            if (!err) {
                return _response.apiSuccess(res, result.length + " " + responsemsg.userFound, result, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalDocs: totalDocs
                })

            } else {
                return _response.apiFailed(res, responsemsg.userListIsEmpty)
            }
        });
    }


}

function update(req, res) {
    let formData = []
    if (req.params.uid) {
        db.query("SELECT * FROM `users` WHERE uid='" + req.params.uid + "'", (err, result) => {
            if (!err && result.length > 0) {

                db.query("UPDATE users SET ?", req.body, (err, result) => {
                    if (!err) {
                        return _response.apiSuccess(res, responsemsg.userUpdateSuccess)
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
        db.query("SELECT * FROM `users` WHERE uid='" + req.params.id + "'", (err, result) => {
            if (!err && result.length > 0) {
                return _response.apiSuccess(res, result.length + " " + responsemsg.userFound, result)
            } else {
                return _response.apiWarning(res, responsemsg.userListIsEmpty)
            }
        });
    } else {
        return _response.apiWarning(res, 'Please select id')
    }
}

function _delete(req, res) {

    if (req.params.uid) {
        db.query("SELECT * FROM `users` WHERE uid='" + req.params.id + "'", (err, result) => {
            if (!result.length) {
                return _response.apiWarning(res, responsemsg.userListIsEmpty)
            } else {
                db.query("DELETE FROM `users` WHERE id='" + req.params.id + "'", (err, result) => {
                    if (!err) {
                        return _response.apiSuccess(res, responsemsg.userDeleteSuccess)
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

function walletUpdate(req, res) {

    const schema = Joi.object({
        wallet: Joi.string().required(),
        increment: Joi.boolean().required()
    });
    const {error} = schema.validate(req.query);
    if (error) return _response.apiFailed(res, error.details[0].message)

    let response = []

    if (req.params.uid) {
        db.query("SELECT * FROM `users` WHERE uid='" + req.params.id + "'", (err, result) => {

            if (!err) {
                response = result[0].wallet
                console.log(response)
                if (req.query.increment && req.query.wallet) {
                    if (req.query.increment === 'true') {
                        let bal = parseFloat(req.query.wallet) + parseFloat(response); // Increment balance
                        console.log(bal)
                        db.query("UPDATE users SET wallet ='" + bal + "' WHERE id = '" + req.params.id + "'", (err, result) => {
                            if (!err) {
                                return _response.apiSuccess(res, responsemsg.userWalletUpdateSuccess)
                            } else {
                                return _response.apiFailed(res, err)
                            }
                        })

                    } else if (req.query.increment === 'false') {
                        let finalBal = null;
                        let replaceBal = parseFloat(response) - parseFloat(req.query.wallet); // Decrement balance
                        if (replaceBal > 0) {
                            db.query("UPDATE users SET wallet ='" + replaceBal + "' WHERE id = '" + req.params.id + "'", (err, result) => {
                                if (!err) {
                                    return _response.apiSuccess(res, responsemsg.userWalletUpdateSuccess)
                                } else {
                                    return _response.apiFailed(res, err)
                                }
                            })
                        } else {
                            return _response.apiFailed(res, "This value is big from current balance")
                        }

                    }
                }

            } else {

            }
        });
    } else {
        return _response.apiWarning(res, 'Please select id')
    }
}

function signup(req, res) {
    const postData = req.body;
    const user = {
        email: postData.email,
        name: postData.name,
        token: postData.token,
    };

    // do the database authentication here, with user name and password combination.
    const accessToken = jwt.sign(user, config.secret, {
        expiresIn: config.tokenLife,
    });
    const refreshToken = jwt.sign(user, config.refreshTokenSecret, {
        expiresIn: config.refreshTokenLife,
    });
    const response = {
        status: "Logged in",
        accessToken: accessToken,
        refreshToken: refreshToken,
    };
    tokenList[refreshToken] = response;

    return res.status(200).json(response);
}


//Get New Access Token When Previous AccessToken is not validate any more
router.post('/get_accessToken', (req, res) => {
    // refresh the damn token
    const postData = req.body

    // if refresh token exists
    if ((postData.refreshToken) && (postData.refreshToken in tokenList)) {
        const user = {
            "email": postData.email,
            "name": postData.name,
            "token": postData.token,
        }
        const accessToken = jwt.sign(user, config.secret, {expiresIn: config.tokenLife})
        const response = {
            "accessToken": accessToken,
        }
        // update the token in the list
        tokenList[postData.refreshToken].accessToken = accessToken
        res.status(200).json(response);

    } else {
        res.status(404).send('refresh token is not valid anymore')
    }
});