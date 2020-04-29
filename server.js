const express = require('express');
const Sentry = require('@sentry/node');
const cors = require("cors");
const mongoose = require('mongoose');
const requireDir = require('require-dir');
require('dotenv/config');

// starting the App
const app = express();

Sentry.init({ dsn: process.env.SENTRY_ENVIRONMENT });

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

app.use(Sentry.Handlers.requestHandler());

// routes
app.use('/api', require('./src/routes'));

app.use(Sentry.Handlers.errorHandler());


app.listen(process.env.PORT || 3001);