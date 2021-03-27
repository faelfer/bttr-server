const Abiliity = require('../models/Abiliity');
const Time = require('../models/Time');

module.exports = {
    async abiliityList(req, res) {
        try {
            const { page } = req.query;

            if (page) {
                const abiliity = await Abiliity.paginate({
                    user: req.userId 
                }, 
                { 
                    page, 
                    limit: 6,
                    select: "-user",
                    sort: { timeTotal: 'desc' } 
                });
    
                if(!abiliity) {
                    return res.status(400).send({ message: "abiliity does not exist" });
                }
    
                return res.json(abiliity);
            } else {
                const abiliity = await Abiliity.find({ user: req.userId })
    
                if(!abiliity) {
                    return res.status(400).send({ message: "abiliity does not exist" });
                }
    
                return res.json(abiliity);

            }

        } catch (error) {
            console.log("abiliityList | error: ",error);
            res.status(500).send(error);
        }
    },

    async abiliityDetail(req, res) {
        try{
            console.log("abiliityDetail | req.userId: ",req.userId);
            console.log("abiliityDetail | req.params.id: ",req.params.id);

            const abiliity = await Abiliity.find({ 
                    user: req.userId,
                    _id: req.params.id
            }).select("-user");

            if(!abiliity) {
                return res.status(400).send({ message: "abiliity or user does not exist" });
            }

            return res.json(abiliity);
        } catch (error) {
            console.log("abiliityDetail | error: ",error);
            res.status(500).send(error);
        }
    },

    async abiliityCreate(req, res) {
        try{
            console.log("abiliityCreate | req.userId: ",req.userId);

            req.body.user = req.userId;
            console.log("abiliityCreate | req.body: ",req.body);
            const abiliity = await Abiliity.create(req.body);

            if(!abiliity) {
                return res.status(400).send({ message: "abiliity does not exist" });
            }

            return res.json({ message: "abiliity successfully created" });
        } catch (error) {
            console.log("abiliityCreate | error: ",error);
            res.status(500).send(error);
        }
    },

    async abiliityUpdate(req, res) {      
        try{  
            console.log("abiliityUpdate | req.userId: ",req.userId);
            console.log("abiliityUpdate | req.params.id: ",req.params.id);

            const abiliity = await Abiliity.findOneAndUpdate({ 
                user: req.userId,
                _id: req.params.id,
            },
                req.body,
            { 
                new: true 
            }
            ).select("-user");

            if(!abiliity) {
                return res.status(400).send({ message: "abiliity or user does not exist" });
            }

            return res.json({ message: "abiliity has been successfully edited" });
        } catch (error) {
            console.log("abiliityUpdate | error: ",error);
            res.status(500).send(error);
        }
    },

    async abiliityAddMinutes(req, res) {
        try {
            console.log("abiliityAddMinutes | req.userId: ",req.userId);
            console.log("abiliityAddMinutes | req.params.id: ",req.params.id);
            console.log("abiliityAddMinutes | req.body.minutes: ",req.body.minutes, typeof req.body.minutes);

            let abiliity = await Abiliity.findOne({ 
                    user: req.userId,
                    _id: req.params.id
            });

            if(!abiliity) {
                return res.status(400).send({ message: "abiliity or user does not exist" });
            }
            console.log("abiliityAddMinutes | abiliity: ",abiliity);
            console.log("abiliityAddMinutes | abiliity.timeTotal: ",abiliity.timeTotal, typeof abiliity.timeTotal);

            abiliity.timeTotal = abiliity.timeTotal + req.body.minutes;

            console.log("abiliityAddMinutes | abiliity.timeTotal: ",abiliity);
            const abiliityNew = await Abiliity.findByIdAndUpdate(
                abiliity._id,
                { "timeTotal": abiliity.timeTotal},
                { new: true }
            );

            console.log("abiliityAddMinutes | abiliityNew: ",abiliityNew);

            const time = await Time.create({
                "minutes": req.body.minutes,
                "abiliity": abiliity._id,
                "user": abiliity.user
            });
            console.log("abiliityAddMinutes | time: ",time);

            return res.json({ message: "minutes successfully added to abiliity" });
        } catch (error) {
            console.log("abiliityAddMinutes | error: ",error);
            res.status(500).send(error);
        }
    },

    async abiliityDelete(req, res) {
        try {
            
            const abiliity = await Abiliity.findOneAndRemove({ 
                user: req.userId,
                _id: req.params.id,
            }
            );

            if(!abiliity) {
                return res.status(400).send({ message: "abiliity does not exist" });
            }

            res.send({ message: "abiliity successfully deleted" });
        } catch (error) {
            console.log("abiliityDelete | error: ",error);
            res.status(500).send({ message: error.message });
        }
    },
}