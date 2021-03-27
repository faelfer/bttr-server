const Time = require('../models/Time');
const Abiliity = require('../models/Abiliity')

module.exports = {
    async timeList(req, res) {
        try {
            console.log("Time.index | req.userId: ",req.userId);

            const { page = 1 } = req.query;
            const time = await Time.paginate({
                user: req.userId 
            }, 
            { 
                page, 
                limit: 5,
                populate: { path: 'abiliity', select: '-user' },
                select: "-user",
                sort: { createAt: 'desc' }
            });

            if(!time) {
                return res.status(400).send({ message: "time does not exist" });
            }

            return res.json(time);
        } catch (error) {
            console.log("timeList | error: ",error);
            res.status(500).send(error);
        }
    },

    async timeDetail(req, res) {
        try{
            console.log("timeDetail | req.userId: ",req.userId);
            console.log("timeDetail | req.params.id: ",req.params.id);

            const time = await Time.findOne({ 
                    user: req.userId,
                    _id: req.params.id
            }).populate({ path: 'abiliity', select: '-user' }).select("-user");

            console.log("timeDetail | time: ",time);

            if(!time) {
                return res.status(400).send({ message: "time or user does not exist" });
            }

            return res.json(time);
        } catch (error) {
            console.log("timeDetail | error: ",error);
            res.status(500).send(error);
        }
    },

    async timeFilterByAbiliity(req, res) {
        try{
            console.log("Time.filterByAbiliity | req.userId: ",req.userId);
            console.log("Time.filterByAbiliity | req.params.id: ",req.params.id);

            const { page = 1 } = req.query;
            const time = await Time.paginate({
                user: req.userId,
                abiliity: req.params.id 
            }, 
            { 
                page, 
                limit: 5,
                populate: { path: 'abiliity', select: '-user' },
                select: "-user",
                sort: { createAt: 'desc' } 
            });

            if(!time) {
                return res.status(400).send({ message: "Time or user does not exist" });
            }

            return res.json(time);
        } catch (error) {
            console.log("Time.filterByAbiliity | error: ",error);
            res.status(500).send(error);
        }
    },

    async timeCreate(req, res) {
        try{
            console.log("timeCreate | req.userId: ",req.userId);

            req.body.user = req.userId;
            console.log("timeCreate | req.body: ",req.body);
            const time = await Time.create(req.body);

            if(!time) {
                return res.status(400).send({ message: "Time does not exist" });
            }

            return res.json({ message: "time successfully created" });
        } catch (error) {
            console.log("timeCreate | error: ",error);
            res.status(500).send(error);
        }
    },

    async timeUpdate(req, res) {
        try {
            const timeUnchanged = await Time.findById(req.params.id);

            if (req.body.abiliity == timeUnchanged.abiliity._id) {
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
    
                console.log("timeUpdate | abiliity.timeTotal: ",abiliity);
                const abiliityNew = await Abiliity.findByIdAndUpdate(
                    req.body.abiliity,
                    { "timeTotal": abiliity.timeTotal},
                    { new: true }
                );
                console.log("timeUpdate | abiliityNew: ",abiliityNew);
    
                if(!time) {
                    return res.status(400).send({ message: "Time does not exist" });
                }

                return res.json({ message: "time has been successfully edited" });

            } else {
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
                    return res.status(400).send({ message: "time does not exist" });
                }
                
                console.log("timeUpdate | abiliity.timeTotal: ",abiliity);
                const abiliityNew = await Abiliity.findByIdAndUpdate(
                    timeUnchanged.abiliity._id,
                    { "timeTotal": abiliity.timeTotal},
                    { new: true }
                );

                console.log("timeUpdate | abiliityNew: ",abiliityNew);

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

                console.log("timeUpdate | abiliityChangedNew: ",abiliityChangedNew);

                return res.json({ message: "time has been successfully edited" });

            }

        } catch (error) {
            console.log("timeUpdate | error: ",error);
            res.status(500).send(error);
        }
    },

    async timeDelete(req, res) {
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

            console.log("timeDelete | abiliityNew: ",abiliityNew);

            res.send({ message: "time successfully deleted" });
        } catch (error) {
            console.log("timeDelete | error: ",error);
            res.status(500).send({ message: error.message });
        }
    },
    
    async timeFilterByAbiliityAndCreatedInCurrentMonth(req, res) {
        try {            
            console.log("timeFilterByAbiliityAndCreatedInCurrentMonth | user: ",req.userId);
            console.log("timeFilterByAbiliityAndCreatedInCurrentMonth | req.params.id: ",req.params.id);

            const currentDate = new Date();
            const beginMonthDate = new Date( currentDate.getFullYear(), (currentDate.getMonth()), 1 );
            console.log("timeFilterByAbiliityAndCreatedInCurrentMonth | beginMonthDate: ", beginMonthDate)
            const endMonthDate = new Date( currentDate.getFullYear(), (currentDate.getMonth() + 1), 0 );
            console.log("timeFilterByAbiliityAndCreatedInCurrentMonth | endMonthDate: ", endMonthDate)

            const time = await Time.find({
                createAt: { $gte: beginMonthDate, $lte: endMonthDate }, 
                user: req.userId,
                abiliity: req.params.id
            }).populate({ path: 'abiliity', select: '-user' }).select("-user");

            if(!time) {
                return res.status(400).send({ message: "Time does not exist" });
            }

            return res.json(time);

        } catch (error) {
            console.log("timeFilterByAbiliityAndCreatedInCurrentMonth | error: ",error);
            res.status(500).send(error);
        }
    },
}