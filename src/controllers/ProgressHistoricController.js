const ProgressHistoric = require('../models/ProgressHistoric');
const User = require('../models/User');

module.exports = {
    async index(req, res) {
        try {
            console.log("ProgressHistoric.index | req.userId: ",req.userId);
            const user = await User.findById(req.userId);
            console.log("ProgressHistoric.index | user: ",user);
            if(!user) {
                return res.status(400).send({ message: "User does not exist" });
            }

            const progressHistoric = await ProgressHistoric.find({ 
                    user: user["_id"]
            });

            if(!progressHistoric) {
                return res.status(400).send({ message: "Progress historic does not exist" });
            }

            return res.json(progressHistoric);
        } catch (error) {
            console.log("ProgressHistoric.index | error: ",error);
            res.status(500).send(error);
        }
    },

    async show(req, res) {
        try{
            console.log("ProgressHistoric.show | req.userId: ",req.userId);
            console.log("ProgressHistoric.show | req.params.id: ",req.params.id);

            const progressHistoric = await ProgressHistoric.findOne({ 
                    user: req.userId,
                    _id: req.params.id
            });

            console.log("ProgressHistoric.show | progressHistoric: ",progressHistoric);

            if(!progressHistoric) {
                return res.status(400).send({ message: "Progress historic or user does not exist" });
            }

            return res.json(progressHistoric);
        } catch (error) {
            console.log("ProgressHistoric.show | error: ",error);
            res.status(500).send(error);
        }
    },

    async filterByProgress(req, res) {
        try{
            console.log("ProgressHistoric.filterByProgress | req.userId: ",req.userId);
            console.log("ProgressHistoric.filterByProgress | req.params.id: ",req.params.id);

            const progressHistoric = await ProgressHistoric.find({ 
                    user: req.userId,
                    progress: req.params.id
            });

            if(!progressHistoric) {
                return res.status(400).send({ message: "Progress historic or user does not exist" });
            }

            return res.json(progressHistoric);
        } catch (error) {
            console.log("ProgressHistoric.filterByProgress | error: ",error);
            res.status(500).send(error);
        }
    },

    async store(req, res) {
        try{
            console.log("ProgressHistoric.store | req.userId: ",req.userId);
            const user = await User.findById(req.userId);
            console.log("ProgressHistoric.store | user: ",user);
            if(!user) {
                return res.status(400).send({ message: "The user does not exist" });
            }
            console.log("ProgressHistoric.store | req.userId: ",req.userId);
            console.log("ProgressHistoric.store | user: ",user["_id"]);
            req.body.user = user["_id"];
            console.log("ProgressHistoric.store | req.body: ",req.body);
            const progressHistoric = await ProgressHistoric.create(req.body);

            if(!progressHistoric) {
                return res.status(400).send({ message: "Progress historic does not exist" });
            }

            return res.json(progressHistoric);
        } catch (error) {
            console.log("Progress.store | error: ",error);
            res.status(500).send(error);
        }
    },

    async update(req, res) {
        try {
            const progressHistoric = await ProgressHistoric.findOneAndUpdate({ 
                user: req.userId,
                _id: req.params.id,
            },
                req.body,
            { 
                new: true 
            }
            );

            if(!progressHistoric) {
                return res.status(400).send({ message: "Progress historic does not exist" });
            }

            return res.json(progressHistoric);
        } catch (error) {
            console.log("ProgressHistoric.update | error: ",error);
            res.status(500).send(error);
        }
    },

    async destroy(req, res) {
        try {
            const progressHistoric = await ProgressHistoric.findByIdAndRemove(req.params.id);

            if(!progressHistoric) {
                return res.status(400).send({ message: "The progress historic does not exist" });
            }

            res.send({ message: "successfully deleted" });
        } catch (error) {
            console.log("ProgressHistoric.destroy | error: ",error);
            res.status(500).send({ message: error.message });
        }
    },

    async historicMonth(req, res) {
        try {
            const user = await User.findById(req.userId);
            
            if(!user) {
                return res.status(400).send({ message: "The token does not exist" });
            }
            
            console.log("ProgressHistoric.progressMonth | user: ",user["_id"]);
            const currentDate = new Date();
            console.log("ProgressHistoric.progressMonth | currentDate.getDate(): ", currentDate.getDate())

            if (currentDate.getDate() != 1) {
                const manipulatedDateStart = new Date( currentDate.getFullYear(), currentDate.getMonth(), 1 );
                console.log("ProgressHistoric.progressMonth | manipulatedDateStart: ", manipulatedDateStart)
                const manipulatedDateEnd = new Date( currentDate.getFullYear(), (currentDate.getMonth() + 1), 0 );
                console.log("ProgressHistoric.progressMonth | manipulatedDateEnd: ", manipulatedDateEnd)

                const progressHistoric = await ProgressHistoric.find({ 
                    createAt: { $gte: manipulatedDateStart, $lte: manipulatedDateEnd }, 
                    user: user["_id"]
                });
    
                if(!progressHistoric) {
                    return res.status(400).send({ message: "Progress historic does not exist" });
                }
    
                return res.json(progressHistoric);

            } else {
                console.log("ProgressHistoric.progressMonth | else ");
                const manipulatedDateStart = new Date( currentDate.getFullYear(), (currentDate.getMonth()), 1 );
                console.log("ProgressHistoric.progressMonth | manipulatedDateStart: ", manipulatedDateStart)
                const manipulatedDateEnd = new Date( currentDate.getFullYear(), (currentDate.getMonth() + 1), 0 );
                console.log("ProgressHistoric.progressMonth | manipulatedDateEnd: ", manipulatedDateEnd)
                
                const progressHistoric = await ProgressHistoric.find({ 
                    createAt: { $gte: manipulatedDateStart, $lte: manipulatedDateEnd }, 
                    user: user["_id"]
                });
    
                if(!progressHistoric) {
                    return res.status(400).send({ message: "Progress historic does not exist" });
                }
    
                return res.json(progressHistoric);

            }
        } catch (error) {
            console.log("ProgressHistoric.progressMonth | error: ",error);
            res.status(500).send(error);
        }
    },
}