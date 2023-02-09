module.exports = app => {
    const trades = require("../controllers/trade.controller.js");

    var router = require("express").Router();

    router.post("/create", trades.create)



    app.use('/league', router);
}