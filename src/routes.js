const express = require('express');
const routes = express.Router();
const verifyJWT = require("./middleware/verifyJWT");
const UserController = require('./controllers/UserController');
const AbiliityController = require('./controllers/AbiliityController');
const TimeController = require('./controllers/TimeController');

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

routes.get("/time", verifyJWT, TimeController.index);
routes.get("/time/:id", verifyJWT, TimeController.show);
routes.get("/time/filter_by_abiliity/:id", verifyJWT, TimeController.filterByAbiliity);
routes.post("/time", verifyJWT, TimeController.store);
routes.put("/time/:id", verifyJWT, TimeController.update);
routes.delete("/time/:id", verifyJWT, TimeController.destroy);
routes.get("/time/historic_month/:id", verifyJWT, TimeController.historicMonth);

routes.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error('Checking Sentry Integration!');
});

routes.get('/test', async (req, res) => {
    res.json({message: 'pass!'})
})

module.exports = routes;