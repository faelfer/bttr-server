const mongoose = require('mongoose');
const dateNowBrazil = require('../utils/timeZoneBrazil');

const AbiliitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    timeDaily: {
        type: Number,
        required: true,
    },
    timeTotal: {
        type: Number,
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

module.exports = mongoose.model('Abiliity', AbiliitySchema);