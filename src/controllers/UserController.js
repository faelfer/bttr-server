const mongoose = require('mongoose');
const Bcrypt = require("bcryptjs");

const User = mongoose.model('User');

module.exports = {
    async index(req, res) {
        const users = await User.find();

        return res.json(users);
    },

    async store(req, res) {
        req.body.password = Bcrypt.hashSync(req.body.password, 10);
        const user = await User.create(req.body);

        return res.json(user);
    }
}