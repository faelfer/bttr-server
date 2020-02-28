const mongoose = require('mongoose');
const Expense = mongoose.model('Expense');
const User = mongoose.model('User');
const workingDaysExpense = require('../utils/workingDaysExpense');
const formatMoney = require('../utils/formatMoney');

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
    },

    async expenseOverviewMonth(req, res) {
        try {
            // console.log(req.headers['authorization']);
            var user = await User.findOne({ token: req.headers['authorization'] });
            if(!user) {
                return res.status(400).send({ message: "The token does not exist" });
            }
            // console.log("expenseOverviewMonth | user: ",user["_id"]);

            let expenses = await Expense.find({
                user: user["_id"]
            });

            if(!expenses) {
                return res.status(400).send({ message: "The progress does not exist" });
            }

            let currentYear = (new Date()).getFullYear();
            // console.log(`Ano Atual: ${currentYear}`);
            let currentMouth = (new Date()).getMonth();
            // console.log(`Mês Atual: ${currentMouth}`);
            let currentDay = (new Date()).getDate();
            // console.log(`Hoje: ${currentDay}`);
            let manipulatedDate = new Date(currentYear, (currentMouth + 1), 0);
            // console.log(`Data Manipulada: ${manipulatedDate}`);
            let lastDayMonth = manipulatedDate.getDate();
            // console.log(`Último Dia do Mês ${lastDayMonth}`);
            // console.log(`Today: ${currentDay}/${currentMouth < 9 ? `0${currentMouth + 1}` : currentMouth + 1 }/${currentYear}`);
            
            const businessDays = workingDaysExpense(lastDayMonth + 5, currentYear, currentMouth);
            // console.log("businessDays: ",businessDays);
            const businessDaysSoFar = workingDaysExpense(currentDay, currentYear, currentMouth);
            // console.log("businessDaysSoFar: ", businessDaysSoFar);
            
            const expensesOverview = expenses.map((item) => {
              let balanceForTheMonth = formatMoney(businessDays * item.expensePerDay);
            //   console.log("balanceForTheMonth: ", balanceForTheMonth);
            
              let balanceEndOfDay = formatMoney( (businessDays * item.expensePerDay) - (businessDaysSoFar * item.expensePerDay) );
            //   console.log("balanceEndOfDay: ",  balanceEndOfDay);
            //   console.log("expenses.map : ", item);
              return {
                "_id": item["_id"],
                "name": item.name,
                "expensePerDay": item.expensePerDay,
                "user": item.user,
                balanceForTheMonth,
                balanceEndOfDay
              };
            });
            
            // console.log("expensesOverview: ", expensesOverview);

            return res.json(expensesOverview);
        } catch (error) {
            // console.log("progressThisMonth | error: ",error);
            res.status(500).send(error);
        }
    }
}