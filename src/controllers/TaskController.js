const mongoose = require('mongoose');
const Task = mongoose.model('Task');

module.exports = {
    async index(req, res) {
        const tasks = await Task.find();

        return res.json(tasks);
    },

    async show(req, res) {
        const task = await Task.findById(req.params.id);

        return res.json(task);
    },

    async store(req, res) {
        const task = await Task.create(req.body);

        return res.json(task);
    },

    async update(req, res) {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        return res.json(task)
    },

    async destroy(req, res) {
        await Task.findByIdAndRemove(req.params.id);

        res.send();
    },

    async tasksForToday(req, res) {
        const earlyDay = new Date();
        earlyDay.setHours(0,0,0,0);
        
        const endOfTheDay = new Date();
        endOfTheDay.setHours(23,59,59,999);
        
        const task = await Task.find({ 
            createAt: { $gte: earlyDay, $lte: endOfTheDay }, 
            user: req.params.id 
        });

        return res.json(task);
    }
}