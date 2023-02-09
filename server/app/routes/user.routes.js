module.exports = app => {
    const users = require("../controllers/user.controller.js");

    var router = require("express").Router();

    router.use((req, res, next) => {
        req.app = app
        next()
    });

    router.post("/create", users.create)



    app.use('/user', router);
}