const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function verifyJWT(req, res, next){
    var token = req.headers['authorization'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    try {
      var decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);
      console.log("Time.store | user: ",user);
      if(!user) {
          return res.status(400).send({ message: "The user does not exist" });
      }

      req.userId = user._id;
      next();

    } catch(err) {
      console.log("verifyJWT | err: ", err);
      if (err.name == "TokenExpiredError") return res.status(401).send({ auth: false, message: 'JWT token has expired.' });

      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

    }
  }