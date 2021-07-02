const mysql = require("mysql");
const express = require("express");
const app = express();
let bodyParser = require("body-parser");
let nodemailer = require("nodemailer");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const morgan = require("morgan");
const _ = require("lodash");
let multer, storage, path, crypto;
multer = require("multer");
path = require("path");
crypto = require("crypto");

let jwt = require("jsonwebtoken");
const config = require("./middleware/config.json"); // refresh
let tokenChecker = require("./middleware/tockenchecker");

//const db = require('./database/db')
const today = new Date().toISOString();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({type: "application/*+json"}));


// enable files upload
app.use(
    fileUpload({
        createParentPath: true,
    })
);


//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(express.static("uploads"));
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization');
    next();
});
app.listen(config.port);


// Router
const router = require('./server/api/index')
app.use(router)


app.get("/secure", tokenChecker.checkToken, (req, res) => {
    res.json({
        success: true,
        message: "SecureSite login Successs",
    });
});

app.get("/test", tokenChecker.checkToken, (req, res) => {
    res.json({
        success: true,
        message: "Running secure siteeee Successs",
    });
});



