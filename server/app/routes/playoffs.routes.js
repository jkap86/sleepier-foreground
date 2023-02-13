'use strict'

module.exports = app => {
    const { getPlayoffLeague } = require('../helpers/getPlayoffLeague');
    var router = require("express").Router();

    router.get("/scores", (req, res) => {
        const playoffs = app.get('playoffs_scoring')
        const allplayers = app.get('allplayers')

        res.send({
            scoring: playoffs,
            allplayers: allplayers
        })
    })

    router.get("/league", async (req, res) => {
        const schedule = app.get('schedule')
        const league = await getPlayoffLeague(req.query.league_id)

        res.send({
            ...league,
            schedule: schedule
        })
    })

    app.use('/playoffs', router);
}