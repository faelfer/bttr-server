const ProgressHistoric = require('../models/ProgressHistoric');

module.exports = {
    async index(req, res) {
        const tasks = await ProgressHistoric.find();

        return res.json(tasks);
    },

    async show(req, res) {
        const task = await ProgressHistoric.findById(req.params.id);

        return res.json(task);
    },

    async store(req, res) {
        const task = await ProgressHistoric.create(req.body);

        return res.json(task);
    },

    async update(req, res) {
        const task = await ProgressHistoric.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        return res.json(task)
    },

    async destroy(req, res) {
        await ProgressHistoric.findByIdAndRemove(req.params.id);

        res.send();
    },
}