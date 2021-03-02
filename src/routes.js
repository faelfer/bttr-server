const express = require('express');
const routes = express.Router();
const verifyJWT = require("./middleware/verifyJWT");
const UserController = require('./controllers/UserController');
const ProgressController = require('./controllers/ProgressController');
const ProgressHistoricController = require('./controllers/ProgressHistoricController');

routes.get("/user/profile", verifyJWT, UserController.profile);
routes.post("/user/sign_up", UserController.signUp);
routes.put("/user/:id", verifyJWT, UserController.update);
routes.delete("/user", verifyJWT, UserController.destroy);
routes.post("/user/sign_in", UserController.signIn);
routes.post("/user/forgot_password", UserController.forgotPassword);
routes.post("/user/redefine_password", verifyJWT, UserController.redefinePassword);

routes.get("/progress", verifyJWT, ProgressController.index);
routes.get("/progress/:id", verifyJWT, ProgressController.show);
routes.post("/progress", verifyJWT, ProgressController.store);
routes.put("/progress/:id", verifyJWT, ProgressController.update);
routes.put("/progress/:id/add_minutes", verifyJWT, ProgressController.addMinutes);
routes.delete("/progress/:id", verifyJWT, ProgressController.destroy);

routes.get("/progress_historic", verifyJWT, ProgressHistoricController.index);
routes.get("/progress_historic/:id", ProgressHistoricController.show);
routes.get("/progress_historic/filter_by_progress/:id", ProgressHistoricController.filterByProgress);
routes.post("/progress_historic", ProgressHistoricController.store);
routes.put("/progress_historic/:id", verifyJWT, ProgressHistoricController.update);
routes.delete("/progress_historic/:id", verifyJWT, ProgressHistoricController.destroy);
routes.get("/progress_historic/extract/:id", verifyJWT, ProgressHistoricController.historicMonth);

routes.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error('Checking Sentry Integration!');
});

routes.get('/test', async (req, res) => {
    res.json({message: 'pass!'})
})

module.exports = routes;