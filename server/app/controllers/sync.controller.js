'use strict'
const db = require("../models");
const User = db.users;
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
            .map(lm => {
                return {
                    user_id: lm.user_id,
                    username: lm.username,
                    avatar: lm.avatar,
                    updatedAt: new Date()
                }
            })

        await User.bulkCreate(leaguemates_sorted, { updateOnDuplicate: ['username', 'avatar', 'updatedAt'] })

        app.set('leaguemates', leaguemates.filter(l => !leaguemates_sorted.find(ls => ls.user_id === l.user_id)))

        const updated_leaguemates_updated = [...updated_leaguemates, ...leaguemates_sorted.map(lms => {
            return {
                user_id: lms.user_id,
                updatedAt: new Date()
            }
        })].flat()

        app.set('updated_leaguemates', updated_leaguemates_updated)


    }

    return

}



