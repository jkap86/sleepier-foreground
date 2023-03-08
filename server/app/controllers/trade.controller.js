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

    if (req.body.leaguemate_ids.length > 0) {
        let conditions = []

        for (let lm of req.body.leaguemate_ids) {
            conditions.push({
                [Op.contains]: lm
            })
        }



        let now = new Date()


        if (req.body.month) {
            now.setMonth(req.body.month)
        }

        const month = now.getMonth()
        now.setDate(1)
        now.setHours(0)
        now.setMinutes(0)
        now.setSeconds(0)
        now.setMilliseconds(0)
        const start = new Date(now).getTime()
        now.setMonth(month + 1)
        const end = new Date(now).getTime()




        try {
            const trades_db = await Trades.findAll({
                where: {
                    [Op.and]: [
                        {
                            managers: {
                                [Op.or]: conditions
                            }
                        },
                        {
                            status_updated: {
                                [Op.gt]: start.toString()
                            }
                        },
                        {
                            status_updated: {
                                [Op.lt]: end.toString()
                            }
                        }
                    ]
                }
            })

            console.log(`${trades_db.length} TRADES...`)

            res.send(trades_db.map(trade => trade.dataValues))
        } catch (error) {
            console.log(error)
        }
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
            && (
                !req.body.player_id2 || (
                    trade.adds[req.body.player_id] === trade.drops[req.body.player_id2]
                )
            )
        )
    )
}

exports.comparison = async (req, res) => {
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
            && trade.adds[req.body.player_id] === trade.drops[req.body.player_id2]
        )
    )
}
