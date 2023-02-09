module.exports = app => {
    const trades = require("../controllers/trade.controller.js");

    var router = require("express").Router();

    router.post("/find", trades.find)



    app.use('/trade', router);
}