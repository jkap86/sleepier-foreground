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
const NodeCache = require('node-cache');

const TradeCache = new NodeCache;

exports.find = async (req, res) => {
    const trades_cache = TradeCache.get(req.body.user_id)

    if (trades_cache) {
        console.log('GETTING TRADES FROM CACHE...')

        const trades_db = await Trades.findAll({
            where: {
                transaction_id: {
                    [Op.in]: trades_cache
                }
            }
        })

        res.send(trades_db.map(trade => trade.dataValues))
    } else if (req.body.leaguemate_ids.length > 0) {
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

        TradeCache.set(req.body.user_id, trades_db.map(trade => trade.dataValues.transaction_id), 30 * 60)

        res.send(trades_db.map(trade => trade.dataValues))
    } else {
        res.send([])
    }
}


exports.pricecheck = async (req, res) => {
    console.log({ PLAYER_ID: req.body.player_id })

    let alltrades;
    try {
        alltrades = await Trades.findAll({
            where: {
                adds: {
                    [req.body.player_id]: {
                        [Op.not]: null
                    }
                }
            }
        })
    } catch (error) {
        console.log(error)
    }
    res.send(alltrades
        .map(trade => trade.dataValues)
        .filter(trade =>
            Object.values(trade.adds).filter(x => x === trade.adds[req.body.player_id]).length === 1
            && !trade.draft_picks.find(pick => pick.new_user?.user_id === trade.adds[req.body.player_id])

        )
    )
}
