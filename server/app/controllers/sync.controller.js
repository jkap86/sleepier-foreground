'use strict'
const db = require("../models");
const User = db.users;
const League = db.leagues;
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
    app.set('updated_leaguemates', [])
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

    let interval = .5 * 60 * 1000

    setInterval(async () => {
        if (app.get('syncing') !== 'true') {
            console.log(`Begin Leaguemates Sync at ${new Date()}`)
            app.set('syncing', 'true')
            await updateLeaguemates(app)
            app.set('syncing', 'false')
            console.log(`Leaguemates Sync completed at ${new Date()}`)
        }

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

    const rounds = ['Week_18', 'WC', 'DIV', 'CONF', 'SB']

    let week = 4


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



    return (24 * 60 * 60 * 1000)
}


const updateLeaguemates = async (app) => {
    const state = app.get('state')
    const updated_leaguemates = app.get('updated_leaguemates').filter(lm => lm.updatedAt > new Date(new Date() - (24 * 60 * 60 * 1000)));
    const leaguemates = app.get('leaguemates').filter(lm => !updated_leaguemates.find(ul => ul.user_id === lm.user_id))

    let leaguemates_sorted;

    if (leaguemates.length > 0) {
        console.log(`${leaguemates.length} Leaguemates to Update...`)
        leaguemates_sorted = leaguemates
            .sort((a, b) => a.time - b.time)
            .slice(0, 250)
            .map(lm => {
                return {
                    user_id: lm.user_id,
                    username: lm.username,
                    avatar: lm.avatar
                }
            })

        await User.bulkCreate(leaguemates_sorted, { updateOnDuplicate: ['username', 'avatar'] })

        app.set('leaguemates', leaguemates.filter(l => !leaguemates_sorted.find(ls => ls.user_id === l.user_id)))

        const updated_leaguemates_updated = [...updated_leaguemates, ...leaguemates_sorted.map(lms => {
            return {
                user_id: lms.user_id,
                updatedAt: new Date()
            }
        })].flat()

        app.set('updated_leaguemates', updated_leaguemates_updated)

        let leaguemate_leagues = app.get('leaguemate_leagues')

        await Promise.all(leaguemates_sorted?.map(async lm => {
            const lm_leagues = await axios.get(`http://api.sleeper.app/v1/user/${lm.user_id}/leagues/nfl/${state.league_season}`)

            leaguemate_leagues.push(lm_leagues.data.map(league => league.league_id))
        }))

        const leaguemate_leagues_updated = Array.from(new Set(leaguemate_leagues.flat()))

        app.set('leaguemate_leagues', leaguemate_leagues_updated)
    } else {
        await updateLeaguemateLeagues(app)
    }

    return

}

const updateLeaguemateLeagues = async (app) => {
    const state = app.get('state')
    const cutoff = new Date(new Date() - (3 * 24 * 60 * 60 * 1000))

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
    return
}

