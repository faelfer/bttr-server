const mongoose = require('mongoose');
const Progress = mongoose.model('Progress');
const User = mongoose.model('User');
const workingDays = require('../utils/workingDays');

module.exports = {
    async index(req, res) {
        const progress = await Progress.find();

        return res.json(progress);
    },

    async show(req, res) {
        try{
            const progress = await Progress.findById(req.params.id);

            if(!progress) {
                return res.status(400).send({ message: "The progress does not exist" });
            }

            return res.json(progress);
        } catch (error) {
            console.log("show | error: ",error);
            res.status(500).send(error);
        }
    },

    async store(req, res) {
        try{
            console.log(req.headers['authorization']);
            var user = await User.findOne({ token: req.headers['authorization'] });
            if(!user) {
                return res.status(400).send({ message: "The token does not exist" });
            }
            console.log("progressMonth | user: ",user["_id"]);
            req.body.user = user["_id"];
            console.log("store | req.body: ",req.body);
            const progress = await Progress.create(req.body);

            if(!progress) {
                return res.status(400).send({ message: "The progress does not exist" });
            }

            return res.json(progress);
        } catch (error) {
            console.log("store | error: ",error);
            res.status(500).send(error);
        }
    },

    async update(req, res) {      
        try{  
            const progress = await Progress.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );

            if(!progress) {
                return res.status(400).send({ message: "The progress does not exist" });
            }

            return res.json(progress);
        } catch (error) {
            console.log("store | error: ",error);
            res.status(500).send(error);
        }
    },

    async progressSum(req, res) {
        try {
            const progress = await Progress.findById(req.params.id);

            if(!progress) {
                return res.status(400).send({ message: "The progress does not exist" });
            }

            // console.log("progressSum | progress: ", progress);
            progress.goalDone += req.body.minutesDone;
            const progressNew = await Progress.findByIdAndUpdate(
                req.params.id, 
                progress, 
                { new: true }
            );

            return res.json(progressNew);
        } catch (error) {
            console.log("progressSum | error: ",error);
            res.status(500).send(error);
        }
    },

    async destroy(req, res) {
        await Progress.findByIdAndRemove(req.params.id);

        res.send();
    },

    async progressMonth(req, res) {
        try {
            console.log(req.headers['authorization']);
            var user = await User.findOne({ token: req.headers['authorization'] });
            if(!user) {
                return res.status(400).send({ message: "The token does not exist" });
            }
            console.log("progressMonth | user: ",user["_id"]);
            
            const currentDate = new Date();
            const manipulatedDateStart = new Date( currentDate.getFullYear(), currentDate.getMonth(), 1 );
            const manipulatedDateEnd = new Date( currentDate.getFullYear(), (currentDate.getMonth() + 1), 0 );

            const progress = await Progress.find({ 
                createAt: { $gte: manipulatedDateStart, $lte: manipulatedDateEnd }, 
                user: user["_id"]
            });

            if(!progress) {
                return res.status(400).send({ message: "The progress does not exist" });
            }

            return res.json(progress);
        } catch (error) {
            console.log("progressMonth | error: ",error);
            res.status(500).send(error);
        }
    },

    async progressOverviewMonth(req, res) {
        try {
            // console.log(req.headers['authorization']);
            var user = await User.findOne({ token: req.headers['authorization'] });
            if(!user) {
                return res.status(400).send({ message: "The token does not exist" });
            }
            // console.log("progressThisMonth | user: ",user["_id"]);
            
            const currentDate = new Date();
            const manipulatedDateStart = new Date( currentDate.getFullYear(), currentDate.getMonth(), 1 );
            const manipulatedDateEnd = new Date( currentDate.getFullYear(), (currentDate.getMonth() + 1), 0 );

            const progress = await Progress.find({ 
                createAt: { $gte: manipulatedDateStart, $lte: manipulatedDateEnd }, 
                user: user["_id"]
            });

            // console.log("progressThisMonth | progress: ", progress);

            if(!progress || progress.length === 0) {
                return res.status(400).send({ message: "The progress does not exist" });
            }

            const manipulatedDate = new Date(
                currentDate.getFullYear(),
                (currentDate.getMonth() + 1),
                0
            );
                // console.log(`Data Manipulada: ${manipulatedDate}`);
              
            const lastDayMonth = manipulatedDate.getDate();
                // console.log(`Último Dia do Mês ${lastDayMonth}`);

            const businessDays = workingDays(lastDayMonth, currentDate.getFullYear(), currentDate.getMonth());
                // console.log("businessDays: ", businessDays);
            const businessDaysSoFar = workingDays(currentDate.getDate(), currentDate.getFullYear(), currentDate.getMonth());
                // console.log("BusinessDaysSoFar: ", businessDaysSoFar);
            const IdealPercentage = `${parseInt((businessDaysSoFar * 100)/businessDays)}%`;
                // console.log(`Ideal percentage so far: ${IdealPercentage}`);
            
            const progressPercentage = progress.map((item, index) => {
                // console.log("============================")
                // console.log("progresses.map | item: ",item);
                let goalTotal = item.goalPerDay * businessDays;
                let goalPercentage = parseInt( (item.goalDone * 100) /goalTotal );
                // console.log("progresses.map | goalTotal: ", goalTotal);
                // console.log("progresses.map | goalPercentage: ", goalPercentage + "%");
                return goalPercentage;
            });
            
            // console.log("progressPercentage: ",progressPercentage);
            
            var sumPercentages = progressPercentage.reduce(function(itemPrimary, itemSecondary){
                return (itemPrimary + itemSecondary);
            }, 0);

            const progressGeneral = parseInt(sumPercentages / progressPercentage.length) + "%";

            return res.json({
                IdealPercentage,  
                progressGeneral, 
                businessDays, 
                businessDaysSoFar
            });

        } catch (error) {
            console.log("progressThisMonth | error: ",error);
            res.status(500).send(error);
        }
    }
}