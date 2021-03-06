const express = require('express');
const routes = express.Router();
const verifyJWT = require("./middleware/verifyJWT");
const UserController = require('./controllers/UserController');
const AbiliityController = require('./controllers/AbiliityController');
const TimeController = require('./controllers/TimeController');

routes.get("/user/profile", verifyJWT, UserController.userProfile);
routes.post("/user/sign_up", UserController.userSignUp);
routes.put("/user/profile", verifyJWT, UserController.userUpdate);
routes.delete("/user/profile", verifyJWT, UserController.userDelete);
routes.post("/user/sign_in", UserController.userSignIn);
routes.post("/user/forgot_password", UserController.userForgotPassword);
routes.post("/user/redefine_password", verifyJWT, UserController.userRedefinePassword);

routes.get("/abiliity", verifyJWT, AbiliityController.abiliityList);
routes.get("/abiliity/:id", verifyJWT, AbiliityController.abiliityDetail);
routes.post("/abiliity", verifyJWT, AbiliityController.abiliityCreate);
routes.put("/abiliity/:id", verifyJWT, AbiliityController.abiliityUpdate);
routes.put("/abiliity/:id/add_minutes", verifyJWT, AbiliityController.abiliityAddMinutes);
routes.delete("/abiliity/:id", verifyJWT, AbiliityController.abiliityDelete);

routes.get("/time", verifyJWT, TimeController.timeList);
routes.get("/time/:id", verifyJWT, TimeController.timeDetail);
routes.get("/time/filter_by_abiliity/:id", verifyJWT, TimeController.timeFilterByAbiliity);
routes.post("/time", verifyJWT, TimeController.timeCreate);
routes.put("/time/:id", verifyJWT, TimeController.timeUpdate);
routes.delete("/time/:id", verifyJWT, TimeController.timeDelete);
routes.get("/time/filter_by_abiliity_and_date/:id", verifyJWT, TimeController.timeFilterByAbiliityAndDate);

routes.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error('Checking Sentry Integration!');
});

routes.get('/test', async (req, res) => {
    res.json({message: 'pass!'})
})

module.exports = routes;