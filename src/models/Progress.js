const mongoose = require('mongoose');

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
        default: Date.now,
    },
});

mongoose.model('Progress', ProgressSchema);