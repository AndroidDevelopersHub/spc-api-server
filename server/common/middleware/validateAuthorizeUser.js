module.exports = function (req, res, next) {
    let config = require("../../../middleware/config.json"); // refresh
    let jwt = require("jsonwebtoken");
    let token = req.headers['x-auth-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        next()
        //res.status(200).send(decoded);
    });

}