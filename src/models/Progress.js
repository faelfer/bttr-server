const mongoose = require('mongoose');
const dateNowBrazil = require('../utils/timeZoneBrazil');

const ProgressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    goalPerDay: {
        type: Number,
        required: true,
    },
    goalDone: {
        type: Number,
        required: true,
    },
    icon: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createAt: {
        type: Date,
        default: dateNowBrazil,
    },
});

module.exports = mongoose.model('Progress', ProgressSchema);