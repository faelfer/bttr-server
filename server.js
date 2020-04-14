const express = require('express');
const cors = require("cors");
const mongoose = require('mongoose');
const requireDir = require('require-dir');
require('dotenv/config');

// starting the App
const app = express();
app.use(express.json());
app.use(cors());
// starting db
mongoose.connect(
    process.env.MONGO_URL, 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useFindAndModify: false 
    }
);
requireDir("./src/models");

// routes
app.use('/api', require('./src/routes'));

app.listen(process.env.PORT || 3001);