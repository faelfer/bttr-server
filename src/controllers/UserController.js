const mongoose = require('mongoose');
const Bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const User = mongoose.model('User');

module.exports = {
    async index(req, res) {
        const users = await User.find();


        const userWithoutPassword = users.map(user => {
            // console.log("User.index | user: ",user);
            let objectUser = user.toObject();
            delete objectUser.password;
            return objectUser;
        });

        // console.log("User.index | user: ",userWithoutPassword);
        return res.json(userWithoutPassword);
    },

    async show(req, res) {
        try {
            const user = await User.findById(req.params.id);

            if(!user) {
                return res.status(400).send({ message: "The user does not exist" });
            }

            var userWithoutPassword = user.toObject();
            delete userWithoutPassword.password;

            return res.json(userWithoutPassword);
        } catch (error) {
            console.log("User.show | error: ",error);
            res.status(500).send(error);
        }
    },

    async store(req, res) {
        req.body.password = Bcrypt.hashSync(req.body.password, 10);
        const user = await User.create(req.body);

        return res.json(user);
    },

    async update(req, res) {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, req.body, {
                new: true
            });

            if(!user) {
                return res.status(400).send({ message: "The user does not exist" });
            }

            return res.json(user);
        } catch (error) {
            console.log("User.update | error: ",error);
            res.status(500).send(error);
        }
    },

    async destroy(req, res) {
        try {
            const user = await User.findByIdAndRemove(req.params.id);

            if(!user) {
                return res.status(400).send({ message: "The user does not exist" });
            }

            res.send();
        } catch (error) {
            console.log("User.destroy | error: ",error);
            res.status(500).send(error);
        }
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

            res.send({ 
                auth: true,
                token: token, 
                message: "The email and password fields are correct!" 
            });
            
        } catch (error) {
            console.log("User.login | error: ",error);
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
            console.log("User.forgotPassword | new password: ",randomText);

            password = Bcrypt.hashSync(randomText, 10);

            await User.findByIdAndUpdate(user["_id"], {password});

            res.send({ message: "The email is correct!" });
        } catch (error) {
            console.log("User.forgotPassword | error: ",error);
            res.status(500).send(error);
        }
    },

    async redefinePassword(req, res) {
        try {
            console.log("redefinePassword | token: ",req.headers['authorization']);
            var user = await User.findOne({ token: req.headers['authorization'] });
            if(!user) {
                return res.status(400).send({ message: "The token does not exist" });
            }

            if(!Bcrypt.compareSync(req.body.currentPassword, user.password)) {
                return res.status(400).send({ message: "The password is invalid" });
            }

            if(req.body.password !== req.body.confirmPassword) {
                return res.status(400).send({ message: "Password and confirm password fields are different" });
            }

            password = Bcrypt.hashSync(req.body.password, 10);

            await User.findByIdAndUpdate(user["_id"], {password});

            res.send({ message: "Password successfully reset!" });
        } catch (error) {
            console.log("User.redefinePassword | error: ",error);
            res.status(500).send(error);
        }

    }
}