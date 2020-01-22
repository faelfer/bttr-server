const mongoose = require('mongoose');
const Bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const User = mongoose.model('User');

module.exports = {
    async index(req, res) {
        const users = await User.find();

        return res.json(users);
    },

    async show(req, res) {
        const user = await User.findById(req.params.id);

        return res.json(user);
    },

    async store(req, res) {
        req.body.password = Bcrypt.hashSync(req.body.password, 10);
        const user = await User.create(req.body);

        return res.json(user);
    },

    async update(req, res) {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        return res.json(user)
    },

    async destroy(req, res) {
        await User.findByIdAndRemove(req.params.id);

        res.send();
    },

    async login(req, res) {
        try {
            var user = await User.findOne({ email: req.body.email });
            if(!user) {
                return res.status(400).send({ message: "The email does not exist" });
            }
            if(!Bcrypt.compareSync(req.body.password, user.password)) {
                return res.status(400).send({ message: "The password is invalid" });
            }

            const token = jwt.sign({ id: user["_id"] }, 'bttr-server', {});

            await User.findByIdAndUpdate(user["_id"], {token});

            res.send({ auth: true, token: token, message: "The email and password combination is correct!" });
        } catch (error) {
            console.log(error)
            res.status(500).send(error);
        }
    },

    async forgotPassword(req, res) {
        try {
            var user = await User.findOne({ email: req.body.email });
            if(!user) {
                return res.status(400).send({ message: "The email does not exist" });
            }

            const randomText = Math.random().toString(36).slice(2); 
            console.log("forgotPassword | new password: ",randomText);

            password = Bcrypt.hashSync(randomText, 10);

            await User.findByIdAndUpdate(user["_id"], {password});

            res.send({ message: "The email is correct!" });
        } catch (error) {
            console.log(error)
            res.status(500).send(error);
        }
    }
}