const Time = require('../models/Time');
const Abiliity = require('../models/Abiliity')

module.exports = {
    async index(req, res) {
        try {
            console.log("Time.index | req.userId: ",req.userId);

            const time = await Time.find({ 
                    user: req.userId
            }).populate('abiliity');

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
            }).populate('abiliity');

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

    async filterByAbiliity(req, res) {
        try{
            console.log("Time.filterByAbiliity | req.userId: ",req.userId);
            console.log("Time.filterByAbiliity | req.params.id: ",req.params.id);

            const time = await Time.find({ 
                    user: req.userId,
                    abiliity: req.params.id
            }).populate('abiliity');

            if(!time) {
                return res.status(400).send({ message: "Time or user does not exist" });
            }

            return res.json(time);
        } catch (error) {
            console.log("Time.filterByAbiliity | error: ",error);
            res.status(500).send(error);
        }
    },

    async store(req, res) {
        try{
            console.log("Time.store | req.userId: ",req.userId);

            req.body.user = req.userId;
            console.log("Time.store | req.body: ",req.body);
            const time = await Time.create(req.body);

            if(!time) {
                return res.status(400).send({ message: "Time does not exist" });
            }

            return res.json(time);
        } catch (error) {
            console.log("Time.store | error: ",error);
            res.status(500).send(error);
        }
    },

    async update(req, res) {
        try {
            const timeUnchanged = await Time.findById(req.params.id);

            if (req.body.abiliity == timeUnchanged.abiliity._id) {
                // subtrair os minutes anteriores
                // adicionar os minutos atualizados
                let abiliity = await Abiliity.findOne({ 
                    user: req.userId,
                    _id: req.body.abiliity
                });
    
                abiliity.timeTotal = (abiliity.timeTotal - timeUnchanged.minutes) + req.body.minutes;

                const time = await Time.findOneAndUpdate({ 
                    user: req.userId,
                    _id: req.params.id,
                },
                    req.body,
                { 
                    new: true 
                }
                );
    
                console.log("Time.update | abiliity.timeTotal: ",abiliity);
                const abiliityNew = await Abiliity.findByIdAndUpdate(
                    req.body.abiliity,
                    { "timeTotal": abiliity.timeTotal},
                    { new: true }
                );
                console.log("Time.update | abiliityNew: ",abiliityNew);
    
                if(!time) {
                    return res.status(400).send({ message: "Time does not exist" });
                }

                return res.json(time);

            } else {
                // subtrair os minutos da habilidade anterior
                // adicionar os minutos a nova habilidade atribuida
                let abiliity = await Abiliity.findOne({ 
                    user: req.userId,
                    _id: timeUnchanged.abiliity._id
                });
    
                abiliity.timeTotal = abiliity.timeTotal - timeUnchanged.minutes;

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
                
                console.log("Time.update | abiliity.timeTotal: ",abiliity);
                const abiliityNew = await Abiliity.findByIdAndUpdate(
                    timeUnchanged.abiliity._id,
                    { "timeTotal": abiliity.timeTotal},
                    { new: true }
                );

                console.log("Time.update | abiliityNew: ",abiliityNew);

                let abiliityChanged = await Abiliity.findOne({ 
                    user: req.userId,
                    _id: req.body.abiliity
                });

                abiliityChanged.timeTotal = abiliityChanged.timeTotal + req.body.minutes;

                const abiliityChangedNew = await Abiliity.findByIdAndUpdate(
                    abiliityChanged._id,
                    { "timeTotal": abiliityChanged.timeTotal},
                    { new: true }
                );

                console.log("Time.update | abiliityChangedNew: ",abiliityChangedNew);

                return res.json(time);

            }

        } catch (error) {
            console.log("Time.update | error: ",error);
            res.status(500).send(error);
        }
    },

    async destroy(req, res) {
        try {
            
            const timeUnchanged = await Time.findById(req.params.id);

            let abiliity = await Abiliity.findOne({ 
                user: req.userId,
                _id: timeUnchanged.abiliity._id
            });

            abiliity.timeTotal = abiliity.timeTotal - timeUnchanged.minutes;

            const time = await Time.findByIdAndRemove(req.params.id);

            if(!time) {
                return res.status(400).send({ message: "Time does not exist" });
            }

            const abiliityNew = await Abiliity.findByIdAndUpdate(
                timeUnchanged.abiliity._id,
                { "timeTotal": abiliity.timeTotal},
                { new: true }
            );

            console.log("Time.update | abiliityNew: ",abiliityNew);

            res.send({ message: "successfully deleted" });
        } catch (error) {
            console.log("Time.destroy | error: ",error);
            res.status(500).send({ message: error.message });
        }
    },

    async historicMonth(req, res) {
        try {            
            console.log("Time.progressMonth | user: ",req.userId);
            console.log("Time.filterByAbiliity | req.params.id: ",req.params.id);

            const currentDate = new Date();
            const beginMonthDate = new Date( currentDate.getFullYear(), (currentDate.getMonth()), 1 );
            console.log("Time.progressMonth | beginMonthDate: ", beginMonthDate)
            const endMonthDate = new Date( currentDate.getFullYear(), (currentDate.getMonth() + 1), 0 );
            console.log("Time.progressMonth | endMonthDate: ", endMonthDate)
            
            const time = await Time.find({ 
                createAt: { $gte: beginMonthDate, $lte: endMonthDate }, 
                user: req.userId,
                abiliity: req.params.id
            }).populate('abiliity');

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