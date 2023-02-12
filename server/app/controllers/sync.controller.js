'use strict'
const db = require("../models");
const User = db.users;
const League = db.leagues;
const Trade = db.trades;
const Op = db.Sequelize.Op;
const https = require('https');
const axios = require('axios').create({
    headers: {
        'content-type': 'application/json'
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
    timeout: 10000
});
const axiosRetry = require('axios-retry');
const { addNewLeagues, updateLeagues } = require('../helpers/addNewLeagues');
const { getAllPlayers } = require('../helpers/getAllPlayers');

axiosRetry(axios, {
    retries: 3,
    retryCondition: (error) => {
        return error.code === 'ECONNABORTED' || error.code === 'ERR_BAD_REQUEST' ||
            axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
    },
    retryDelay: (retryCount) => {
        return retryCount * 3000
    },
    shouldResetTimeout: true
})


exports.boot = async (app) => {
    const date = new Date()
    const tzOffset = date.getTimezoneOffset()
    const tzOffset_ms = tzOffset * 60 * 1000
    const date_tz = new Date(date + tzOffset_ms)
    const hour = date_tz.getHours()
    const minute = date_tz.getMinutes()

    let delay;
    if (hour < 3) {
        delay = (((3 - hour) * 60) + (60 - minute)) * 60 * 1000
    } else {
        delay = (((27 - hour) * 60) + (60 - minute)) * 60 * 1000
    }

    const state = await axios.get('https://api.sleeper.app/v1/state/nfl')
    app.set('state', state.data)

    const allplayers = await getAllPlayers(axios, state.data)
    app.set('allplayers', allplayers)

    app.set('leaguemate_leagues', [])
    app.set('leaguemates', [])
    app.set('trades_sync_counter', 0)

    setTimeout(async () => {
        setInterval(async () => {

            const state = await axios.get('https://api.sleeper.app/v1/state/nfl')
            app.set('state', state.data)

            const allplayers = await getAllPlayers(axios, state.data)
            app.set('allplayers', allplayers)

        }, 24 * 60 * 60 * 1 * 1000)
    }, delay)

    console.log('Server Boot Complete...')
    return
}

exports.leaguemates = async (app) => {
    console.log(`Begin Leaguemates Sync at ${new Date()}`)
    let interval = .5 * 60 * 1000

    setTimeout(async () => {
        await updateLeaguemates(app)
        await updateLeaguemateLeagues(app)
        await exports.leaguemates(app)
        const used = process.memoryUsage()
        for (let key in used) {
            console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }
    }, interval)
    console.log(`Leaguemates Sync completed at ${new Date()}`)
}

exports.trades = async (app) => {
    let interval = 5 * 60 * 1000

    setInterval(async () => {
        await updateTrades(app)

        const used = process.memoryUsage()
        for (let key in used) {
            console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }
    }, interval)
}

exports.playoffs = async (app) => {
    let scoring_interval = await playoffs_scoring(app)
    console.log(`Next scoring update in ${Math.floor(scoring_interval / (60 * 60 * 1000))} hours, ${Math.floor(scoring_interval % (60 * 60 * 1000) / (60 * 1000))} minutes`)
    setTimeout(async () => {
        await exports.playoffs(app)
    }, scoring_interval)
}

const playoffs_scoring = async (app) => {
    const schedule_cur_week = await axios.get(`https://api.myfantasyleague.com/2022/export?TYPE=nflSchedule&W=&JSON=1`)

    const rounds = ['Week_18', 'WC', 'DIV', 'CONF', 'SB']

    let week;
    if (schedule_cur_week.data.nflSchedule.matchup?.find(x => x.gameSecondsRemaining !== "0")) {
        week = schedule_cur_week.data.nflSchedule.week - 17
    } else {
        week = schedule_cur_week.data.nflSchedule.week - 18
    }


    let schedule = await app.get('schedule')
    if (!schedule) {
        let schedule = {}
        let i = week

        while (i >= 0) {
            const schedule_week = await axios.get(`https://api.myfantasyleague.com/${2022}/export?TYPE=nflSchedule&W=${i + 18}&JSON=1`)
            schedule[rounds[i]] = schedule_week.data.nflSchedule.matchup
            i -= 1
        }
        await app.set('schedule', schedule)

        let player_scores = {}

        await Promise.all(Array.from(Array(5).keys())
            .slice(0, week + 1)
            .map(async key => {
                let scores_dict_week = {};
                let scores_week;
                if (key === 0) {
                    scores_week = await axios.get(`https://api.sleeper.com/stats/nfl/2022/18?season_type=regular`)
                } else {
                    scores_week = await axios.get(`https://api.sleeper.com/stats/nfl/2022/${key}?season_type=post`)
                }

                scores_week.data.map(player => {
                    return scores_dict_week[player.player_id] = {
                        id: player.player_id,
                        ...player.stats
                    }
                })

                player_scores[rounds[key]] = {
                    index: key,
                    ...scores_dict_week
                }
            }))

        app.set('playoffs_scoring', player_scores)
        return 5000
    }

    const nextKickoff = Math.min(
        ...schedule[rounds[week]]
            .filter(x => x.gameSecondsRemaining !== '0')
            .map(m => parseInt(m.kickoff))
    )
    if ((nextKickoff * 1000) - Date.now() > 0) {
        console.log('No Games in Progress..')


        return Math.min(60 * 60 * 1000, (nextKickoff * 1000) - Date.now())
    }
    let player_scores = {}

    await Promise.all(Array.from(Array(5).keys())
        .slice(0, week + 1)
        .map(async key => {
            let scores_dict_week = {};
            let scores_week;
            if (key === 0) {
                scores_week = await axios.get(`https://api.sleeper.com/stats/nfl/2022/18?season_type=regular`)
            } else {
                scores_week = await axios.get(`https://api.sleeper.com/stats/nfl/2022/${key}?season_type=post`)
            }

            scores_week.data.map(player => {
                return scores_dict_week[player.player_id] = {
                    id: player.player_id,
                    ...player.stats
                }
            })

            player_scores[rounds[key]] = {
                index: key,
                ...scores_dict_week
            }
        }))

    app.set('playoffs_scoring', player_scores)

    const updated_schedule_week = await axios.get(`https://api.myfantasyleague.com/${2022}/export?TYPE=nflSchedule&JSON=1`)

    schedule[rounds[updated_schedule_week.data.nflSchedule.week - 18]] = updated_schedule_week.data.nflSchedule.matchup

    app.set('schedule', schedule)

    console.log(`Games in Progress...`)

    return (30 * 1000)
}


const updateLeaguemates = async (app) => {
    const state = app.get('state')
    const leaguemates = app.get('leaguemates')
    let leaguemates_sorted;

    if (leaguemates.length > 0) {
        console.log(`${leaguemates.length} Leaguemates to Update...`)
        leaguemates_sorted = leaguemates
            .sort((a, b) => a.time - b.time)
            .map(lm => {
                return {
                    user_id: lm.user_id,
                    username: lm.username,
                    avatar: lm.avatar
                }
            })

        await User.bulkCreate(leaguemates_sorted, { updateOnDuplicate: ['username', 'avatar'] })

        app.set('leaguemates', [])

        let leaguemate_leagues = app.get('leaguemate_leagues')

        await Promise.all(leaguemates_sorted?.map(async lm => {
            const lm_leagues = await axios.get(`http://api.sleeper.app/v1/user/${lm.user_id}/leagues/nfl/${state.league_season}`)

            leaguemate_leagues.push(lm_leagues.data.map(league => league.league_id))
        }))

        const leaguemate_leagues_updated = Array.from(new Set(leaguemate_leagues.flat()))

        app.set('leaguemate_leagues', leaguemate_leagues_updated)
    }

    return

}

const updateLeaguemateLeagues = async (app) => {
    const state = app.get('state')
    const cutoff = new Date(new Date() - (1 * 24 * 60 * 60 * 1000))

    const league_ids = app.get('leaguemate_leagues')

    let leagues_user_db;

    if (league_ids.length > 0) {
        try {
            leagues_user_db = await League.findAll({
                where: {
                    league_id: {
                        [Op.in]: league_ids
                    }
                }
            })
        } catch (error) {
            console.log(error)
        }
    } else {
        leagues_user_db = []
    }

    leagues_user_db = leagues_user_db.map(league => league.dataValues)

    const leagues_to_update = leagues_user_db.filter(l_db => l_db.updatedAt < cutoff).map(league => league.league_id)
    const new_leagues = league_ids
        .filter(l => !leagues_user_db.find(l_db => l_db.league_id === l))

    console.log(`${new_leagues.length} Leagues to add, ${leagues_to_update.length} Leagues to update`)
    if (new_leagues.length > 0) {
        const leagues_to_add = new_leagues.slice(0, 50)

        const new_leagues_pending = new_leagues.filter(l => !leagues_to_add.includes(l))
        const leagues_pending = [...new_leagues_pending, ...leagues_to_update]


        console.log({ NEW_LEAGUES_PENDING: leagues_pending })

        app.set('leaguemate_leagues', leagues_pending)

        await addNewLeagues(axios, state, League, leagues_to_add, state.league_season, true)

        console.log(`${leagues_to_add.length} leagues added, ${new_leagues_pending.length} Leagues Left to add, ${leagues_to_update.length} Leagues Left to update`)
    } else {
        const leagues_to_update_batch = leagues_to_update.slice(0, 250)

        const leagues_to_update_pending = leagues_to_update.filter(l => !leagues_to_update_batch.includes(l))

        app.set('leaguemate_leagues', leagues_to_update_pending)

        await updateLeagues(axios, state, League, leagues_to_update_batch, state.league_season, true)

        console.log(`${leagues_to_update_batch.length} leagues updated, ${leagues_to_update_pending.length} Leagues left to update`)
    }
}

const updateTrades = async (app) => {
    console.log(`Begin Transactions Sync at ${new Date()}`)

    const state = app.get('state')
    let i = app.get('trades_sync_counter')
    const increment = 500

    const leagues_to_update = await League.findAll({
        where: {
            season: state.league_season
        },
        order: [['createdAt', 'ASC']],
        offset: i,
        limit: increment
    })

    console.log(`Updating trades for ${i + 1}-${Math.min(i + 1 + increment, i + leagues_to_update.length)} Leagues...`)

    let transactions_week = []

    await Promise.all(leagues_to_update
        .filter(x => x.dataValues.rosters)
        .map(async league => {
            let transactions_league;

            try {
                transactions_league = await axios.get(`https://api.sleeper.app/v1/league/${league.dataValues.league_id}/transactions/${state.season_type === 'regular' ? state.week : 1}`)
            } catch (error) {
                console.log(error)
                transactions_league = {
                    data: []
                }
            }

            return transactions_league.data
                .map(transaction => {
                    const draft_order = league.drafts.find(d => d.draft_order && d.status !== 'complete')?.draft_order
                    const managers = transaction.roster_ids.map(roster_id => {
                        const user = league.dataValues.rosters?.find(x => x.roster_id === roster_id)

                        return user?.user_id
                    })

                    const draft_picks = transaction.draft_picks.map(pick => {
                        const roster = league.dataValues.rosters.find(x => x.roster_id === pick.roster_id)

                        return {
                            ...pick,
                            original_user: {
                                user_id: roster?.user_id,
                                username: roster?.username,
                                avatar: roster?.avatar,
                            },
                            order: draft_order && roster?.user_id ? draft_order[roster?.user_id] : null
                        }
                    })

                    let adds = {}
                    transaction.adds && Object.keys(transaction.adds).map(add => {
                        const user = league.dataValues.rosters?.find(x => x.roster_id === transaction.adds[add])
                        return adds[add] = user?.user_id
                    })

                    let drops = {}
                    transaction.drops && Object.keys(transaction.drops).map(drop => {
                        const user = league.dataValues.rosters?.find(x => x.roster_id === transaction.drops[drop])
                        return drops[drop] = user?.user_id
                    })

                    if (transaction.type === 'trade' && transaction.adds) {
                        return transactions_week.push({
                            transaction_id: transaction.transaction_id,
                            status_updated: transaction.status_updated,
                            managers: managers,
                            adds: adds,
                            drops: drops,
                            draft_picks: draft_picks,
                            league: {
                                league_id: league.league_id,
                                name: league.name,
                                avatar: league.avatar,
                                best_ball: league.best_ball,
                                type: league.type,
                                roster_positions: league.roster_positions,
                                scoring_settings: league.scoring_settings

                            },
                            users: league.users,
                            rosters: league.rosters,
                            drafts: league.drafts
                        })
                    }

                })
        })
    )

    Trade.bulkCreate(transactions_week, { updateOnDuplicate: ['manager', 'adds', 'drops', 'draft_picks', 'league', 'users', 'rosters', 'drafts'] })

    if (leagues_to_update.length < increment) {
        app.set('trades_sync_counter', 0)
    } else {
        app.set('trades_sync_counter', i + increment)
    }

    console.log(`Transactions Sync completed at ${new Date()}`)
}