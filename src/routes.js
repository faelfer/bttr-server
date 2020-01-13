const express = require('express');
const routes = express.Router();
const verifyJWT = require("./middleware/verifyJWT");
const UserController = require('./controllers/UserController');

routes.get("/users", verifyJWT, UserController.index);
routes.get("/users/:id", UserController.show);
routes.post("/users", UserController.store);
routes.put("/users/:id", UserController.update);
routes.delete("/users/:id", UserController.destroy);
routes.post("/login", UserController.login);

module.exports = routes;