const mysql = require("mysql");

let whichServer = 1;  // 1 for Dev server 2 for Local server

let connection = null;

if (whichServer === 1) {
    // Dev
    connection = mysql.createConnection({
        host: "127.0.0.1 ",
        user: "unitlytl_ufd",
        password: "1982gonzoO",
        database: "unitlytl_ufd",
        port: "3306"

    });
} else {
    //Local
    connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "123456", // "" , "root"
        database: "allgskji_spc",
        port: 8889
    });
}

connection.connect((err) => {
    if (err) throw err;
    console.log("Connected!");
});


module.exports = connection;