const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

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
        default: Date.now,
    },
});

AbiliitySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Abiliity', AbiliitySchema);