'use strict'
const db = require("../models");
const Trades = db.trades;
const League = db.leagues;
const Op = db.Sequelize.Op;
const https = require('https');
const axios = require('axios').create({
    headers: {
        'content-type': 'application/json'
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true })
});
const NodeCache = require('node-cache');
const { parse } = require("querystring");

const TradeCache = new NodeCache;



exports.find = async (req, res) => {

    if (req.body.leaguemate_ids.length > 0) {




        let filters = []
        if (req.body.player) {
            const pick_split = req.body.player.split(' ')
            const season = pick_split[0]
            const round = parseInt(pick_split[1]?.split('.')[0])
            const order = parseInt(pick_split[1]?.split('.')[1])

            console.log({
                season: season,
                round: round,
                order: order
            })

            filters.push({
                [Op.or]: [
                    {
                        adds: {
                            [req.body.player]: {
                                [Op.not]: null
                            }
                        }
                    },
                    {
                        draft_picks: {
                            [Op.contains]: [{
                                season: season,
                                round: round,
                                order: order
                            }]
                        }
                    }
                ]
            })
        }
        if (req.body.league) {
            filters.push({
                league: {
                    league_id: req.body.league
                }
            })
        }
        if (req.body.manager) {
            filters.push({
                managers: {
                    [Op.contains]: [req.body.manager]
                }
            })
        }

        let adds = []
        let players = []

        if (parseInt(req.body.tips) === 1) {
            let leagues = await League.findAll({
                attributes: ['league_id', 'rosters'],
                where: {
                    users: {
                        [Op.contains]: [req.body.user_id]
                    }
                }
            })



            leagues.map(league => {
                return league.dataValues.rosters
                    ?.map(r => {
                        return r.players?.map(player_id => {
                            return players.push(player_id)
                        })
                    })
            })

            console.log({ players: players.slice(0, 5) })



            Array.from(new Set(players)).map(player_id => {
                const lms = []
                leagues.map(league => {
                    const lm = league.dataValues.rosters.find(r => r.players?.includes(player_id))
                    if (lm) {
                        lms.push(lm.user_id)
                    }
                })

                return adds.push({
                    [player_id]: {
                        [Op.in]: lms
                    }

                })
            })

            filters.push({
                drops: {
                    [Op.or]: adds
                }
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
            const trades_db = await Trades.findAndCountAll({
                order: [['status_updated', 'DESC']],
                offset: req.body.offset,
                limit: 500,
                where: {
                    [Op.and]: [
                        {
                            managers: {
                                [Op.overlap]: req.body.leaguemate_ids
                            }
                        },
                        filters
                    ]
                }
            })
            console.log(`${trades_db.count} TRADES...`)
            res.send(trades_db)
        } catch (error) {
            console.log(error)
        }
    } else {
        res.send([])
    }
}


exports.pricecheck = async (req, res) => {
    const pick_split = req.body.player_id.split(' ')
    const season = pick_split[0]
    const round = parseInt(pick_split[1]?.split('.')[0])
    const order = parseInt(pick_split[1]?.split('.')[1])

    console.log({
        season: season,
        round: round,
        order: order
    })
    let alltrades;
    try {
        alltrades = await Trades.findAll({
            where: {
                [Op.or]: [
                    {
                        draft_picks: {
                            [Op.contains]: [{
                                season: season,
                                round: round,
                                order: order
                            }]
                        }
                    },
                    {
                        adds: {
                            [req.body.player_id]: {
                                [Op.not]: null
                            }
                        }
                    }
                ]
            }
        })
    } catch (error) {
        console.log(error)
    }
    res.send(alltrades
        .map(trade => trade.dataValues)
        .filter(trade => {
            const query_pick = trade.draft_picks.find(
                pick => pick.season === season
                    && pick.round === round
                    && pick.order === order
            )
            return (
                Object.values(trade.adds).filter(x => x === trade.adds[req.body.player_id]).length === 1
                && !trade.draft_picks.find(pick => pick.new_user?.user_id === trade.adds[req.body.player_id])
                && (
                    !req.body.player_id2 || (
                        trade.adds[req.body.player_id] === trade.drops[req.body.player_id2]
                    )
                )
            ) || (
                    trade.draft_picks.filter(pick => pick.new_user?.user_id === query_pick?.new_user?.user_id).length === 1
                    && !Object.values(trade.adds).find(manager_user_id => manager_user_id === query_pick?.new_user?.user_id)
                )

        })
    )
}

exports.rankings = async (req, res, app) => {
    const stateAllPlayers = app.get('allplayers')
    let alltrades;
    try {
        alltrades = await (await Trades.findAll({}))
            .map(trade => trade.dataValues)
            .filter(trade => new Date(parseInt(trade.status_updated)) >= new Date(new Date() - 90 * 24 * 60 * 60 * 1000) && trade.league.roster_positions.includes("SUPER_FLEX"))
    } catch (error) {
        console.log(error)
    }

    const alltradedplayers = Array.from(new Set(alltrades.map(trade => {
        if (new Date(parseInt(trade.status_updated)) >= new Date(new Date() - 7 * 24 * 60 * 60 * 1000)) {
            return [...Object.keys(trade.adds), ...Object.keys(trade.adds), ...Object.keys(trade.adds)].flat()
        } else if (new Date(parseInt(trade.status_updated)) >= new Date(new Date() - 30 * 24 * 60 * 60 * 1000)) {
            return [...Object.keys(trade.adds), ...Object.keys(trade.adds)].flat()
        } else {
            return Object.keys(trade.adds)
        }
    }).flat()))

    let rankings = {}

    alltradedplayers.map(player_id => {
        const player_trades = alltrades
            .filter(trade =>
                Object.keys(trade.adds).includes(player_id)
                && Object.values(trade.adds).filter(x => x === trade.adds[player_id]).length === 1
                && !trade.draft_picks.find(pick => pick.new_user?.user_id === trade.adds[player_id])

            )

        return rankings[player_id] = player_trades
            .map(trade => Object.keys(trade.adds)).flat()
            .filter(p => p !== player_id)
    })

    const trade_rankings = Object.keys(rankings)
        .filter(player_id => stateAllPlayers[player_id]?.position === req.query.pos)
        .map(player_id => {
            const score = rankings[player_id]
                .filter(player_id2 => stateAllPlayers[player_id2]?.position === req.query.pos)
                .reduce(
                    (acc, cur) => acc + Array.from(new Set(rankings[cur])).reduce(
                        (acc2, cur2) => acc2 + Array.from(new Set(rankings[cur2])).length, 0
                    ), 0
                )


            return {
                player: stateAllPlayers[player_id]?.full_name,
                score: score
            }
        })

    /*
        const rankings_score = Object.keys(rankings)
            .map(player_id => {
                return {
                    player: stateAllPlayers[player_id]?.full_name,
                    score: rankings[player_id].reduce(
                        (acc, cur) => acc + Array.from(new Set(rankings[cur])).length, 0
                    )
                }
            })
            .sort((a, b) => b.score - a.score)
    */
    res.send({

        rankings: trade_rankings.sort((a, b) => b.score - a.score).slice(0, 100).map((ranking, index) => {
            return {
                ...ranking,
                rank: index + 1
            }
        })
    })
}
