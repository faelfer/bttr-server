const express = require('express');
const mongoose = require("mongoose");

// starting the App
const app = express();

// starting db
mongoose.connect('mongodb://localhost:27017/bttrserver', { useNewUrlParser: true, useUnifiedTopology: true });

// first route
app.get("/", (req, res) => {
    res.send("hello world!");
})

app.listen(3001);