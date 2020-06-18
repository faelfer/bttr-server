const express = require('express');
const routes = express.Router();
const verifyJWT = require("./middleware/verifyJWT");
const UserController = require('./controllers/UserController');
const ProgressController = require('./controllers/ProgressController');
const ProgressHistoricController = require('./controllers/ProgressHistoricController');

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
routes.get("/progress_overview_month", verifyJWT, ProgressController.progressOverviewMonth);

routes.get("/progress_historic", verifyJWT, ProgressHistoricController.index);
routes.get("/progress_historic/:id", ProgressHistoricController.show);
routes.post("/progress_historic", ProgressHistoricController.store);
routes.put("/progress_historic/:id", verifyJWT, ProgressHistoricController.update);
routes.delete("/progress_historic/:id", verifyJWT, ProgressHistoricController.destroy);

routes.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error('Checking Sentry Integration!');
});

routes.get('/test', async (req, res) => {
    res.json({message: 'pass!'})
})

module.exports = routes;