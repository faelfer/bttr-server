const mongoose = require('mongoose');

const timeZoneBrazil = require('../utils/timeZoneBrazil');


const ProgressSchema = new mongoose.Schema({
    goalAdded: {
        type: Number,
        required: true,
    },
    progress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Progress'
    },
    ProgressName: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createAt: {
        type: Date,
        default: timeZoneBrazil,
    },
});

module.exports = mongoose.model('ProgressHistoric', ProgressSchema);