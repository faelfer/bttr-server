const ProgressHistoric = require('../models/ProgressHistoric');

module.exports = {
    async index(req, res) {
        const progressHistorics = await ProgressHistoric.find();

        return res.json(progressHistorics);
    },

    async show(req, res) {
        const progressHistoric = await ProgressHistoric.findById(req.params.id);

        return res.json(progressHistoric);
    },

    async store(req, res) {
        const progressHistoric = await ProgressHistoric.create(req.body);

        return res.json(progressHistoric);
    },

    async update(req, res) {
        const progressHistoric = await ProgressHistoric.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        return res.json(progressHistoric)
    },

    async destroy(req, res) {
        await ProgressHistoric.findByIdAndRemove(req.params.id);

        res.send();
    },
}