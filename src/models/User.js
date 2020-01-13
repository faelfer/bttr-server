const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        trim: true,
        required: true,
    },
    username: {
        type: String,
        trim: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        default: null,
    },
});

mongoose.model('User', UserSchema);