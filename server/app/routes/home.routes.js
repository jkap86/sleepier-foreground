'use strict'

module.exports = app => {

    var router = require("express").Router();

    router.get("/", (req, res) => {
        const state = app.get('state')
        const allplayers = app.get('allplayers')

        res.send({
            state: state,
            allplayers: allplayers
        })
    })



    app.use('/home', router);
}