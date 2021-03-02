const mongoose = require('mongoose');
const dateNowBrazil = require('../utils/timeZoneBrazil');


const ProgressSchema = new mongoose.Schema({
    minutes: {
        type: Number,
        required: true,
    },
    progress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Progress'
    },
    progressName: {
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

module.exports = mongoose.model('ProgressHistoric', ProgressSchema);