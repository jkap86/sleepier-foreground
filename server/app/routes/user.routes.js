'use strict'

module.exports = app => {
    const users = require("../controllers/user.controller.js");

    var router = require("express").Router();

    router.use((req, res, next) => {
        req.app = app
        next()
    });

    router.post("/create", users.create)

    router.post("/leaguemates", users.leaguemates)

    router.get("/all", users.getAll)

    app.use('/user', router);
}