const Abiliity = require('../models/Abiliity');
const User = require('../models/User');
const Time = require('../models/Time');

module.exports = {
    async index(req, res) {
        try {
            console.log("Abiliity.index | req.userId: ",req.userId);
            const user = await User.findById(req.userId);
            console.log("Abiliity.index | user: ",user);

            if(!user) {
                return res.status(400).send({ message: "User does not exist" });
            }

            const abiliity = await Abiliity.find({ 
                    user: user["_id"]
            });

            if(!abiliity) {
                return res.status(400).send({ message: "Abiliity does not exist" });
            }

            return res.json(abiliity);
        } catch (error) {
            console.log("Abiliity.index | error: ",error);
            res.status(500).send(error);
        }
    },

    async show(req, res) {
        try{
            console.log("Abiliity.show | req.userId: ",req.userId);
            console.log("Abiliity.show | req.params.id: ",req.params.id);

            const abiliity = await Abiliity.find({ 
                    user: req.userId,
                    _id: req.params.id
            });

            if(!abiliity) {
                return res.status(400).send({ message: "Abiliity or user does not exist" });
            }

            return res.json(abiliity);
        } catch (error) {
            console.log("Abiliity.show | error: ",error);
            res.status(500).send(error);
        }
    },

    async store(req, res) {
        try{
            console.log("Abiliity.store | req.userId: ",req.userId);
            const user = await User.findById(req.userId);
            console.log("Abiliity.store | user: ",user);
            if(!user) {
                return res.status(400).send({ message: "User does not exist" });
            }
            console.log("Abiliity.store | req.userId: ",req.userId);
            console.log("Abiliity.store | user: ",user["_id"]);
            req.body.user = user["_id"];
            console.log("Abiliity.store | req.body: ",req.body);
            const abiliity = await Abiliity.create(req.body);

            if(!abiliity) {
                return res.status(400).send({ message: "Abiliity does not exist" });
            }

            return res.json(abiliity);
        } catch (error) {
            console.log("Abiliity.store | error: ",error);
            res.status(500).send(error);
        }
    },

    async update(req, res) {      
        try{  
            console.log("Abiliity.update | req.userId: ",req.userId);
            console.log("Abiliity.update | req.params.id: ",req.params.id);

            const abiliity = await Abiliity.findOneAndUpdate({ 
                user: req.userId,
                _id: req.params.id,
            },
                req.body,
            { 
                new: true 
            }
            );

            if(!abiliity) {
                return res.status(400).send({ message: "Abiliity or user does not exist" });
            }

            return res.json(abiliity);
        } catch (error) {
            console.log("Abiliity.update | error: ",error);
            res.status(500).send(error);
        }
    },

    async addMinutes(req, res) {
        try {
            console.log("Abiliity.addMinutes | req.userId: ",req.userId);
            console.log("Abiliity.addMinutes | req.params.id: ",req.params.id);
            console.log("Abiliity.addMinutes | req.body.minutes: ",req.body.minutes);
            
            let abiliity = await Abiliity.findOne({ 
                    user: req.userId,
                    _id: req.params.id
            });

            if(!abiliity) {
                return res.status(400).send({ message: "Abiliity or user does not exist" });
            }
            console.log("Abiliity.addMinutes | abiliity: ",abiliity);

            abiliity.timeTotal = abiliity.timeTotal + req.body.minutes;


            console.log("Abiliity.addMinutes | abiliity.timeTotal: ",abiliity);
            const abiliity = await Abiliity.findByIdAndUpdate(
                abiliity._id,
                { "timeTotal": abiliity.timeTotal},
                { new: true }
            );

            console.log("Abiliity.addMinutes | abiliity: ",abiliity);

            const time = await Time.create({
                "minutes": req.body.minutes,
                "abiliity": abiliity._id,
                "abiliityName": abiliity.name,
                "user": abiliity.user
            }
            );
            console.log("Abiliity.addMinutes | time: ",time);

            return res.json(time);
        } catch (error) {
            console.log("Abiliity.addMinutes | error: ",error);
            res.status(500).send(error);
        }
    },

    async destroy(req, res) {
        try {
            
            const abiliity = await Abiliity.findOneAndRemove({ 
                user: req.userId,
                _id: req.params.id,
            }
            );

            if(!abiliity) {
                return res.status(400).send({ message: "Abiliity does not exist" });
            }

            res.send({ message: "successfully deleted" });
        } catch (error) {
            console.log("Abiliity.destroy | error: ",error);
            res.status(500).send({ message: error.message });
        }
    },
}