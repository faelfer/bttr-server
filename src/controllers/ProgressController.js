const Progress = require('../models/Progress');
const User = require('../models/User');
const ProgressHistoric = require('../models/ProgressHistoric');
const workingDays = require('../utils/workingDays');
const dateNowBrazil = require('../utils/timeZoneBrazil');

module.exports = {
    async index(req, res) {
        try {
            console.log("Progress.index | req.userId: ",req.userId);
            const user = await User.findById(req.userId);
            console.log("Progress.index | user: ",user);
            if(!user) {
                return res.status(400).send({ message: "User does not exist" });
            }

            const progress = await Progress.find({ 
                    user: user["_id"]
            });

            if(!progress) {
                return res.status(400).send({ message: "Progress does not exist" });
            }

            return res.json(progress);
        } catch (error) {
            console.log("Progress.index | error: ",error);
            res.status(500).send(error);
        }
    },

    async show(req, res) {
        try{
            console.log("Progress.show | req.userId: ",req.userId);

            console.log("Progress.show | req.params.id: ",req.params.id);
            const progress = await Progress.find({ 
                    user: req.userId,
                    _id: req.params.id
            });

            if(!progress) {
                return res.status(400).send({ message: "Progress or user does not exist" });
            }

            return res.json(progress);
        } catch (error) {
            console.log("Progress.show | error: ",error);
            res.status(500).send(error);
        }
    },

    async store(req, res) {
        try{
            console.log("Progress.store | req.userId: ",req.userId);
            const user = await User.findById(req.userId);
            console.log("Progress.store | user: ",user);
            if(!user) {
                return res.status(400).send({ message: "The user does not exist" });
            }
            console.log("Progress.store | req.userId: ",req.userId);
            console.log("Progress.store | user: ",user["_id"]);
            req.body.user = user["_id"];
            console.log("Progress.store | req.body: ",req.body);
            const progress = await Progress.create(req.body);

            if(!progress) {
                return res.status(400).send({ message: "The progress does not exist" });
            }

            return res.json(progress);
        } catch (error) {
            console.log("Progress.store | error: ",error);
            res.status(500).send(error);
        }
    },

    async update(req, res) {      
        try{  
            console.log("Progress.update | req.userId: ",req.userId);
            console.log("Progress.update | req.params.id: ",req.params.id);

            const progress = await Progress.findOneAndUpdate({ 
                user: req.userId,
                _id: req.params.id,
            },
                req.body,
            { 
                new: true 
            }
            );

            if(!progress) {
                return res.status(400).send({ message: "Progress or user does not exist" });
            }

            return res.json(progress);
        } catch (error) {
            console.log("Progress.update | error: ",error);
            res.status(500).send(error);
        }
    },

    async addMinutes(req, res) {
        try {
            console.log("Progress.addMinutes | req.userId: ",req.userId);
            console.log("Progress.addMinutes | req.params.id: ",req.params.id);
            console.log("Progress.addMinutes | req.body.minutes: ",req.body.minutes);
            
            let progress = await Progress.find({ 
                    user: req.userId,
                    _id: req.params.id
            });

            if(!progress) {
                return res.status(400).send({ message: "Progress or user does not exist" });
            }
            console.log("Progress.addMinutes | progress[0]: ",progress[0]);

            progress[0].goalDone = progress[0].goalDone + req.body.minutes;


            console.log("Progress.addMinutes | progress.goalDone: ",progress[0]);
            const progressNew = await Progress.findByIdAndUpdate(
                progress[0]._id,
                { "goalDone": progress[0].goalDone},
                { new: true }
            );

            console.log("Progress.addMinutes | progressNew: ",progressNew);

            const historic = await ProgressHistoric.create({
                "minutes": req.body.minutes,
                "progress": progress[0]._id,
                "progressName": progress[0].name,
                "user": progress[0].user
            }
            );
            console.log("Progress.addMinutes | historic: ",historic);

            return res.json(progressNew);
        } catch (error) {
            console.log("Progress.addMinutes | error: ",error);
            res.status(500).send(error);
        }
    },

    async destroy(req, res) {
        try {
            
            const progress = await Progress.findOneAndRemove({ 
                user: req.userId,
                _id: req.params.id,
            }
            );

            if(!progress) {
                return res.status(400).send({ message: "The progress does not exist" });
            }

            res.send({ message: "successfully deleted" });
        } catch (error) {
            console.log("Progress.destroy | error: ",error);
            res.status(500).send({ message: error.message });
        }
    },
}