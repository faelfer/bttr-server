const mongoose = require('mongoose');
const Progress = mongoose.model('Progress');
const User = mongoose.model('User');

module.exports = {
    async index(req, res) {
        const progress = await Progress.find();

        return res.json(progress);
    },

    async show(req, res) {
        const progress = await Progress.findById(req.params.id);

        return res.json(progress);
    },

    async store(req, res) {
        const progress = await Progress.create(req.body);

        return res.json(progress);
    },

    async update(req, res) {
        const progress = await Progress.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        return res.json(progress)
    },

    async destroy(req, res) {
        await Progress.findByIdAndRemove(req.params.id);

        res.send();
    },

    async progressThisMonth(req, res) {
        try {
            console.log(req.headers['authorization']);
            var user = await User.findOne({ token: req.headers['authorization'] });
            if(!user) {
                return res.status(400).send({ message: "The token does not exist" });
            }
            console.log("progressThisMonth | user: ",user["_id"]);
            
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
            console.log("progressThisMonth | error: ",error);
            res.status(500).send(error);
        }
    },

    async overviewThisMonth(req, res) {
        try {
            console.log(req.headers['authorization']);
            var user = await User.findOne({ token: req.headers['authorization'] });
            if(!user) {
                return res.status(400).send({ message: "The token does not exist" });
            }
            console.log("progressThisMonth | user: ",user["_id"]);
            
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

            const manipulatedDate = new Date(
                currentDate.getFullYear(),
                (currentDate.getMonth() + 1),
                0
            );
            console.log(`Data Manipulada: ${manipulatedDate}`);
              
            const lastDayMonth = manipulatedDate.getDate();
            console.log(`Último Dia do Mês ${lastDayMonth}`);
            
            const overview = progress.map((item, index) => {
                console.log("============================")
                console.log("progresses.map | item: ",item);
                let goalTotal = item.goalPerDay * lastDayMonth
                let percentage = parseInt((item.goalDone * 100)/goalTotal);
                console.log("progresses.map | goalTotal: ", goalTotal);
                console.log("progresses.map | percentage: ", percentage + " %");
                return percentage;
            });
            
            console.log(overview);
            
            var sum = overview.reduce(function(a, b){
            return (a + b);
            }, 0);
            
            const percentageOverview = parseInt(sum/overview.length);

            return res.json(percentageOverview);
        } catch (error) {
            console.log("progressThisMonth | error: ",error);
            res.status(500).send(error);
        }
    }
}