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
    const state = await axios.get('https://api.sleeper.app/v1/state/nfl')
    app.set('state', state.data)

    app.set('leaguemate_leagues', [])
    app.set('leaguemates', [])
    app.set('trades_sync_counter', 0)
    console.log('Server Boot Complete...')
    return
}

exports.leaguemates = async (app) => {
    let interval = 1 * 60 * 1000

    setTimeout(async () => {
        await updateLeaguemates(app)
        await updateLeaguemateLeagues(app)
        await exports.leaguemates(app)
        const used = process.memoryUsage()
        for (let key in used) {
            console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }
    }, interval)
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



const updateLeaguemates = async (app) => {
    console.log(`Begin Leaguemates Sync at ${new Date()}`)
    const state = app.get('state')
    const leaguemates = app.get('leaguemates')
    console.log(`${leaguemates.length} Leaguemates to Update...`)
    const leaguemates_sorted = leaguemates
        .sort((a, b) => a.time - b.time)
        .map(lm => {
            return {
                user_id: lm.user_id,
                username: lm.username,
                avatar: lm.avatar
            }
        })

    await User.bulkCreate(leaguemates_sorted, { updateOnDuplicate: ['username', 'avatar'] })

    let leaguemate_leagues = app.get('leaguemate_leagues')

    await Promise.all(leaguemates_sorted.map(async lm => {
        const lm_leagues = await axios.get(`http://api.sleeper.app/v1/user/${lm.user_id}/leagues/nfl/${state.league_season}`)

        leaguemate_leagues.push(lm_leagues.data.map(league => league.league_id))
    }))

    const leaguemate_leagues_updated = Array.from(new Set(leaguemate_leagues.flat()))

    app.set('leaguemate_leagues', leaguemate_leagues_updated)

    app.set('leaguemates', [])

    console.log(`Leaguemates Sync completed at ${new Date()}`)
}

const updateLeaguemateLeagues = async (app) => {
    console.log(`Begin Leaguemate Leagues Sync at ${new Date()}`)
    const state = app.get('state')
    const cutoff = new Date(new Date() - (1 * 60 * 1000))

    const league_ids = app.get('leaguemate_leagues')

    let leagues_user_db = await League.findAll({
        where: {
            league_id: {
                [Op.in]: league_ids
            }
        }
    })

    leagues_user_db = leagues_user_db.map(league => league.dataValues)

    const leagues_to_update = leagues_user_db.filter(l_db => l_db.updatedAt < cutoff)
    const new_leagues = league_ids
        .filter(l => !leagues_user_db.find(l_db => l_db.league_id === l))

    console.log(`${new_leagues.length} Leagues to add, ${leagues_to_update.length} Leagues to update`)
    if (new_leagues.length > 0) {
        const leagues_to_add = new_leagues.slice(0, 50)

        const new_leagues_pending = new_leagues.filter(l => !leagues_to_add.includes(l))

        app.set('leaguemate_leagues', [...new_leagues_pending, ...leagues_to_update.map(l => l.league_id)].flat())

        await addNewLeagues(axios, state, League, leagues_to_add, state.league_season, sync = true)

        console.log(`${leagues_to_add.length} leagues added, ${new_leagues_pending.length} Leagues Left to add, ${leagues_to_update.length} Leagues Left to update`)
    } else {
        const leagues_to_update_batch = leagues_to_update.slice(0, 250)

        const leagues_to_update_pending = leagues_to_update.filter(l => !leagues_to_update_batch.includes(l))

        app.set('leaguemate_leagues', leagues_to_update_pending)

        await updateLeagues(axios, state, League, leagues_to_update_batch, state.league_season, sync = true)

        console.log(`${leagues_to_update_batch.length} leagues updated, ${leagues_to_update_pending.length} Leagues left to update`)
    }



    console.log(`Leaguemate Leagues Sync completed at ${new Date()}`)
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
                                avatar: league.avatar
                            },
                            users: league.users,
                            rosters: league.rosters,
                            drafts: league.drafts
                        })
                    }

                })
        })
    )

    Trade.bulkCreate(transactions_week, { ignoreDuplicates: true })

    if (leagues_to_update.length < increment) {
        app.set('trades_sync_counter', 0)
    } else {
        app.set('trades_sync_counter', i + increment)
    }

    console.log(`Transactions Sync completed at ${new Date()}`)
}