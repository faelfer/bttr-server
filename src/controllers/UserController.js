const Bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const sendUser = require('../utils/sendEmail');

module.exports = {

    async profile(req, res) {
        try {

            const user = await User.findById(req.params.id);
            console.log("User.show | user: ",user);

            if(!user) {
                return res.status(400).send({ message: "The user does not exist" });
            }
            console.log("User.show | req.userId: ",req.userId);
            if(req.userId != user._id) {
                return res.status(403).send({ message: "Access was not authorized" });
            }

            var userWithoutPassword = user.toObject();
            delete userWithoutPassword.password;

            return res.json(userWithoutPassword);
        } catch (error) {
            console.log("User.show | error: ",error);
            res.status(500).send(error);
        }
    },

    async signUp(req, res) {
        try {
            req.body.password = Bcrypt.hashSync(req.body.password, 10);
            const user = await User.create(req.body);

            let message = {
                from: `${process.env.ACCOUNT_NAME} <${process.env.ACCOUNT_EMAIL}>`,
                to: req.body.email,
                subject: 'Welcome',
                text: 'Successful registration!',
                html: '<p>Successful registration!</p>'
            };
            
            console.log("User.store | message: ",message);

            const responseEmail = sendUser(message);

            console.log("User.store | responseEmail: ",responseEmail);
    
            return res.json(user);
        } catch (error) {
            console.log("User.store | error: ",error);
            res.status(500).send(error);
        }
    },

    async update(req, res) {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, req.body, {
                new: true
            });

            if(!user) {
                return res.status(400).send({ message: "The user does not exist" });
            }

            if(req.userId != user._id) {
                return res.status(403).send({ message: "Access was not authorized" });
            }

            return res.json(user);
        } catch (error) {
            console.log("User.update | error: ",error);
            res.status(500).send(error);
        }
    },

    async destroy(req, res) {
        try {
            if(req.userId != user._id) {
                return res.status(403).send({ message: "Access was not authorized" });
            }
            
            const user = await User.findByIdAndRemove(req.params.id);

            if(!user) {
                return res.status(400).send({ message: "The user does not exist" });
            }

            res.send({ message: "successfully deleted" });
        } catch (error) {
            console.log("User.destroy | error: ",error);
            res.status(500).send({ message: error.message });
        }
    },

    async signIn(req, res) {
        try {
            var user = await User.findOne({ email: req.body.email });
            if(!user) {
                return res.status(400).send({ message: "The email does not exist" });
            }
            if(!Bcrypt.compareSync(req.body.password, user.password)) {
                return res.status(403).send({ message: "The password is invalid" });
            }

            const token = jwt.sign({ id: user["_id"] }, 'bttr-server', { expiresIn: "14 days" });

            await User.findByIdAndUpdate(user["_id"], {token});

            res.send({ 
                auth: true,
                token, 
                message: "E-mail and password are correct!" 
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

            await User.findByIdAndUpdate(
                user["_id"], 
                { password }
            );

            res.send({ message: "The email is correct!" });
        } catch (error) {
            console.log("User.forgotPassword | error: ",error);
            res.status(500).send(error);
        }
    },

    async redefinePassword(req, res) {
        try {
            console.log("redefinePassword | req.userId: ",req.userId);
            const user = await User.findById(req.userId);

            if(!user) {
                return res.status(400).send({ message: "The user does not exist" });
            }

            if(req.userId != user._id) {
                return res.status(403).send({ message: "Access was not authorized" });
            }

            if(!Bcrypt.compareSync(req.body.currentPassword, user.password)) {
                return res.status(400).send({ message: "The password is invalid" });
            }

            if(req.body.password !== req.body.confirmPassword) {
                return res.status(400).send({ message: "Password and confirm password fields are different" });
            }

            password = Bcrypt.hashSync(req.body.password, 10);

            await User.findByIdAndUpdate(
                user["_id"],
                { password }
            );

            res.send({ message: "Password successfully reset!" });
        } catch (error) {
            console.log("User.redefinePassword | error: ",error);
            res.status(500).send(error);
        }

    }
}