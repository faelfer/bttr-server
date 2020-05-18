const mongoose = require('mongoose');

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
    createAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('ProgressHistoric', ProgressSchema);