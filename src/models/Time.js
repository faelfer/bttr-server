const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');


const TimeSchema = new mongoose.Schema({
    minutes: {
        type: Number,
        required: true,
    },
    abiliity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Abiliity'
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

TimeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Time', TimeSchema);