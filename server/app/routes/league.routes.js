'use strict'

module.exports = app => {
    const leagues = require("../controllers/league.controller.js");

    var router = require("express").Router();

    router.post("/create", (req, res) => {
        leagues.create(req, res, app)
    })

    router.post("/draft", async (req, res) => {
        leagues.draft(req, res, app)
    })

    router.post('/sync', leagues.sync)

    app.use('/league', router);
}