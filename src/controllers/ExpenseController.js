const mongoose = require('mongoose');
const Expense = mongoose.model('Expense');

module.exports = {
    async index(req, res) {
        const expenses = await Expense.find();

        return res.json(expenses);
    },

    async show(req, res) {
        try {
            const expense = await Expense.findById(req.params.id);

            if(!expense) {
                return res.status(400).send({ message: "The expense does not exist" });
            }

            return res.json(expense);
        } catch (error) {
            console.log("Expense.show | error: ",error);
            res.status(500).send(error);
        }
    },

    async store(req, res) {
        try {
            const expense = await Expense.create(req.body);

            return res.json(expense);
        } catch (error) {
            console.log("Expense.store | error: ",error);
            res.status(500).send(error);
        }
    },

    async update(req, res) {
        try {
            const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
                new: true
            });

            if(!expense) {
                return res.status(400).send({ message: "The expense does not exist" });
            }

            return res.json(expense);
        } catch (error) {
            console.log("Expense.update | error: ",error);
            res.status(500).send(error);
        }
    },

    async destroy(req, res) {
        try {
            await Expense.findByIdAndRemove(req.params.id);

            res.send();
        } catch (error) {
            console.log("Expense.destroy | error: ",error);
            res.status(500).send(error);
        }
    }
}