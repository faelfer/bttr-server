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
}