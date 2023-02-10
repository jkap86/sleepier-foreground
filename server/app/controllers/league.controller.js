const db = require("../models");
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
const { addNewLeagues, updateLeagues } = require('../helpers/addNewLeagues');

const myCache = new NodeCache;

exports.create = async (req, res, app) => {
    const leagues_cache = myCache.get(`${req.body.user_id}_${req.body.season}`)

    if (leagues_cache) {
        console.log('GETTING LEAGUES FROM CACHE...')
        res.send(leagues_cache)
    } else {
        let state = await axios.get('https://api.sleeper.app/v1/state/nfl')
        state = state.data
        const leagues = await axios.get(`http://api.sleeper.app/v1/user/${req.body.user_id}/leagues/nfl/${req.body.season}`)

        const cutoff = new Date(new Date() - (3 * 60 * 60 * 1000))
        const league_ids = leagues.data.map(league => league.league_id)


        let leagues_user_db = await League.findAll({
            where: {
                league_id: {
                    [Op.in]: league_ids
                }
            }
        })

        leagues_user_db = leagues_user_db.map(league => league.dataValues)


        const leagues_updated = leagues_user_db.filter(l_db => l_db.updatedAt >= cutoff)
        const leagues_to_update = leagues_user_db.filter(l_db => l_db.updatedAt < cutoff).map(league => league.league_id)
        const leagues_to_add = league_ids
            .filter(l => !leagues_user_db.find(l_db => l_db.league_id === l))


        const new_leagues = await addNewLeagues(axios, state, League, leagues_to_add, req.body.season)


        const updated_leagues = await updateLeagues(axios, state, League, leagues_to_update, req.body.season)



        const leagues_all = (
            [...leagues_updated, ...updated_leagues, ...new_leagues]
                .map(league => {
                    const userRoster = league.rosters?.find(r => r.user_id === req.body.user_id || r.co_owners?.find(co => co?.user_id === req.body.user_id))
                    return {
                        ...league,
                        index: league_ids.findIndex(l => {
                            return l === league.league_id
                        }),
                        userRoster: userRoster
                    }
                })
                .filter(league => league.userRoster?.players?.length > 0)
                .sort((a, b) => a.index - b.index)
        )

        myCache.set(`${req.body.user_id}_${req.body.season}`, leagues_all, 15 * 60)

        let leaguemates = app.get('leaguemates')

        leagues_all
            .map(league => {
                return league.rosters
                    .map(roster => {

                        if (roster.user_id?.length > 1 && !leaguemates.find(lm => lm.user_id === roster.user_id)) {
                            leaguemates.push({
                                user_id: roster.user_id,
                                username: roster.username,
                                avatar: roster.avatar,
                                time: new Date()
                            })
                        }
                    })
            })

        app.set('leaguemates', leaguemates)

        res.send(leagues_all)
    }
}