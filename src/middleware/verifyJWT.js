const jwt = require('jsonwebtoken');

module.exports = function verifyJWT(req, res, next){
    var token = req.headers['authorization'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    try {
      var decoded = jwt.verify(token, 'bttr-server');

      req.userId = decoded.id;
      next();

    } catch(err) {
      console.log("verifyJWT | err: ", err);
      if (err.name == "TokenExpiredError") return res.status(401).send({ auth: false, message: 'JWT token has expired.' });

      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

    }
  }