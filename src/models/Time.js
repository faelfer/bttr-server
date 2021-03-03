const mongoose = require('mongoose');
const dateNowBrazil = require('../utils/timeZoneBrazil');


const TimeSchema = new mongoose.Schema({
    minutes: {
        type: Number,
        required: true,
    },
    abiliity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Abiliity'
    },
    abiliityName: {
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

module.exports = mongoose.model('Time', TimeSchema);