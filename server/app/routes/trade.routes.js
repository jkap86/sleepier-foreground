'use strict'

module.exports = app => {
    const trades = require("../controllers/trade.controller.js");

    var router = require("express").Router();

    router.post("/find", trades.find)

    router.post("/pricecheck", trades.pricecheck)

    router.post("/comparison", trades.comparison)

    app.use('/trade', router);
}