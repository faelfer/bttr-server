const Time = require('../models/Time');
const User = require('../models/User');

module.exports = {
    async index(req, res) {
        try {
            console.log("Time.index | req.userId: ",req.userId);
            const user = await User.findById(req.userId);
            console.log("Time.index | user: ",user);
            if(!user) {
                return res.status(400).send({ message: "User does not exist" });
            }

            const time = await Time.find({ 
                    user: user["_id"]
            });

            if(!time) {
                return res.status(400).send({ message: "Time does not exist" });
            }

            return res.json(time);
        } catch (error) {
            console.log("Time.index | error: ",error);
            res.status(500).send(error);
        }
    },

    async show(req, res) {
        try{
            console.log("Time.show | req.userId: ",req.userId);
            console.log("Time.show | req.params.id: ",req.params.id);

            const time = await Time.findOne({ 
                    user: req.userId,
                    _id: req.params.id
            });

            console.log("Time.show | time: ",time);

            if(!time) {
                return res.status(400).send({ message: "Time or user does not exist" });
            }

            return res.json(time);
        } catch (error) {
            console.log("Time.show | error: ",error);
            res.status(500).send(error);
        }
    },

    async filterByProgress(req, res) {
        try{
            console.log("Time.filterByProgress | req.userId: ",req.userId);
            console.log("Time.filterByProgress | req.params.id: ",req.params.id);

            const time = await Time.find({ 
                    user: req.userId,
                    progress: req.params.id
            });

            if(!time) {
                return res.status(400).send({ message: "Time or user does not exist" });
            }

            return res.json(time);
        } catch (error) {
            console.log("Time.filterByProgress | error: ",error);
            res.status(500).send(error);
        }
    },

    async store(req, res) {
        try{
            console.log("Time.store | req.userId: ",req.userId);
            const user = await User.findById(req.userId);
            console.log("Time.store | user: ",user);
            if(!user) {
                return res.status(400).send({ message: "The user does not exist" });
            }
            console.log("Time.store | req.userId: ",req.userId);
            console.log("Time.store | user: ",user["_id"]);
            req.body.user = user["_id"];
            console.log("Time.store | req.body: ",req.body);
            const time = await Time.create(req.body);

            if(!time) {
                return res.status(400).send({ message: "Time does not exist" });
            }

            return res.json(time);
        } catch (error) {
            console.log("Progress.store | error: ",error);
            res.status(500).send(error);
        }
    },

    async update(req, res) {
        try {
            const time = await Time.findOneAndUpdate({ 
                user: req.userId,
                _id: req.params.id,
            },
                req.body,
            { 
                new: true 
            }
            );

            if(!time) {
                return res.status(400).send({ message: "Time does not exist" });
            }

            return res.json(time);
        } catch (error) {
            console.log("Time.update | error: ",error);
            res.status(500).send(error);
        }
    },

    async destroy(req, res) {
        try {
            const time = await Time.findByIdAndRemove(req.params.id);

            if(!time) {
                return res.status(400).send({ message: "Time does not exist" });
            }

            res.send({ message: "successfully deleted" });
        } catch (error) {
            console.log("Time.destroy | error: ",error);
            res.status(500).send({ message: error.message });
        }
    },

    async historicMonth(req, res) {
        try {            
            console.log("Time.progressMonth | user: ",req.userId);
            console.log("Time.filterByProgress | req.params.id: ",req.params.id);

            const currentDate = new Date();
            const beginMonthDate = new Date( currentDate.getFullYear(), (currentDate.getMonth()), 1 );
            console.log("Time.progressMonth | beginMonthDate: ", beginMonthDate)
            const endMonthDate = new Date( currentDate.getFullYear(), (currentDate.getMonth() + 1), 0 );
            console.log("Time.progressMonth | endMonthDate: ", endMonthDate)
            
            const time = await Time.find({ 
                createAt: { $gte: beginMonthDate, $lte: endMonthDate }, 
                user: req.userId,
                progress: req.params.id
            });

            if(!time) {
                return res.status(400).send({ message: "Time does not exist" });
            }

            return res.json(time);

        } catch (error) {
            console.log("Time.progressMonth | error: ",error);
            res.status(500).send(error);
        }
    },
}