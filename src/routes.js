const express = require('express');
const routes = express.Router();
const verifyJWT = require("./middleware/verifyJWT");
const UserController = require('./controllers/UserController');
const ProgressController = require('./controllers/ProgressController');
const TaskController = require('./controllers/TaskController');

routes.get("/users", verifyJWT, UserController.index);
routes.get("/users/:id", verifyJWT, UserController.show);
routes.post("/users", UserController.store);
routes.put("/users/:id", verifyJWT, UserController.update);
routes.delete("/users/:id", verifyJWT, UserController.destroy);
routes.post("/login", UserController.login);

routes.get("/progress", verifyJWT, ProgressController.index);
routes.get("/progress/:id", ProgressController.show);
routes.post("/progress", ProgressController.store);
routes.put("/progress/:id", ProgressController.update);
routes.delete("/progress/:id", ProgressController.destroy);
routes.get("/progress_this_month/:id", ProgressController.progressThisMonth);

routes.get("/tasks", verifyJWT, TaskController.index);
routes.get("/tasks/:id", TaskController.show);
routes.post("/tasks", TaskController.store);
routes.put("/tasks/:id", TaskController.update);
routes.delete("/tasks/:id", TaskController.destroy);
routes.get("/tasks_for_today/:id", TaskController.tasksForToday);


module.exports = routes;