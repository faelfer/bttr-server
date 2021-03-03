const express = require('express');
const routes = express.Router();
const verifyJWT = require("./middleware/verifyJWT");
const UserController = require('./controllers/UserController');
const AbiliityController = require('./controllers/AbiliityController');
const ProgressHistoricController = require('./controllers/ProgressHistoricController');

routes.get("/user/profile", verifyJWT, UserController.profile);
routes.post("/user/sign_up", UserController.signUp);
routes.put("/user/:id", verifyJWT, UserController.update);
routes.delete("/user", verifyJWT, UserController.destroy);
routes.post("/user/sign_in", UserController.signIn);
routes.post("/user/forgot_password", UserController.forgotPassword);
routes.post("/user/redefine_password", verifyJWT, UserController.redefinePassword);

routes.get("/abiliity", verifyJWT, AbiliityController.index);
routes.get("/abiliity/:id", verifyJWT, AbiliityController.show);
routes.post("/abiliity", verifyJWT, AbiliityController.store);
routes.put("/abiliity/:id", verifyJWT, AbiliityController.update);
routes.put("/abiliity/:id/add_minutes", verifyJWT, AbiliityController.addMinutes);
routes.delete("/abiliity/:id", verifyJWT, AbiliityController.destroy);

routes.get("/progress_historic", verifyJWT, ProgressHistoricController.index);
routes.get("/progress_historic/:id", verifyJWT, ProgressHistoricController.show);
routes.get("/progress_historic/filter_by_progress/:id", verifyJWT, ProgressHistoricController.filterByProgress);
routes.post("/progress_historic", verifyJWT, ProgressHistoricController.store);
routes.put("/progress_historic/:id", verifyJWT, ProgressHistoricController.update);
routes.delete("/progress_historic/:id", verifyJWT, ProgressHistoricController.destroy);
routes.get("/progress_historic/historic_month/:id", verifyJWT, ProgressHistoricController.historicMonth);

routes.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error('Checking Sentry Integration!');
});

routes.get('/test', async (req, res) => {
    res.json({message: 'pass!'})
})

module.exports = routes;