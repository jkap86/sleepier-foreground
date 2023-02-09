module.exports = app => {
    const leagues = require("../controllers/league.controller.js");

    var router = require("express").Router();

    router.post("/create", (req, res) => {
        leagues.create(req, res, app)
    })



    app.use('/league', router);
}