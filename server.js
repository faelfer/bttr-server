const express = require('express');
const mongoose = require('mongoose');
const requireDir = require('require-dir');

// starting the App
const app = express();

// starting db
mongoose.connect(
    'mongodb://localhost:27017/bttrserver', 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    }
);
requireDir("./src/models");

// routes
app.use('/api', require('./src/routes'));

app.listen(3001);