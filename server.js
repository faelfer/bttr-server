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

const User = mongoose.model('User');

// first route
app.get("/", (req, res) => {
    User.create({
        email: "rfapp00@gmail.com",
        username: "NYDino",
        password: "123"
    })

    res.send("hello world!");
})

app.listen(3001);