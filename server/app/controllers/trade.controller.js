'use strict'
const db = require("../models");
const Trades = db.trades;
const Op = db.Sequelize.Op;
const https = require('https');
const axios = require('axios').create({
    headers: {
        'content-type': 'application/json'
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true })
});


exports.find = async (req, res) => {
    let conditions = []

    for (let lm of req.body.leaguemate_ids) {
        conditions.push({
            [Op.contains]: lm
        })
    }

    const trades_db = await Trades.findAll({
        where: {
            managers: {
                [Op.or]: conditions
            }
        }
    })

    res.send(trades_db.map(trade => trade.dataValues))
}


