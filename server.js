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
    `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useFindAndModify: false 
    }
);
requireDir("./src/models");

// routes
app.use('/api', require('./src/routes'));

app.listen(3001);