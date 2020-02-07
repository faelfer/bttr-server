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
routes.post("/forgot_password", UserController.forgotPassword);
routes.post("/redefine_password", UserController.redefinePassword);

routes.get("/progress", verifyJWT, ProgressController.index);
routes.get("/progress/:id", ProgressController.show);
routes.post("/progress", ProgressController.store);
routes.put("/progress/:id", verifyJWT, ProgressController.update);
routes.put("/progress_sum/:id", verifyJWT, ProgressController.progressSum);
routes.delete("/progress/:id", verifyJWT, ProgressController.destroy);
routes.get("/progress_month", verifyJWT, ProgressController.progressMonth);
routes.get("/overview_month", verifyJWT, ProgressController.overviewMonth);

routes.get("/tasks", verifyJWT, TaskController.index);
routes.get("/tasks/:id", TaskController.show);
routes.post("/tasks", TaskController.store);
routes.put("/tasks/:id", TaskController.update);
routes.delete("/tasks/:id", TaskController.destroy);
routes.get("/tasks_for_today/:id", TaskController.tasksForToday);


module.exports = routes;