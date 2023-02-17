'use strict'
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

const LeagueCache = new NodeCache;

exports.create = async (req, res, app) => {
    const leagues_cache = LeagueCache.get(`${req.body.user_id}_${req.body.season}`)

    if (leagues_cache) {
        console.log('GETTING LEAGUES FROM CACHE...')
        res.send(leagues_cache)
    } else {
        let already_syncing = app.get('syncing') || 0
        app.set('syncing', already_syncing += 1)
        let state = await axios.get('https://api.sleeper.app/v1/state/nfl')
        state = state.data
        const leagues = await axios.get(`http://api.sleeper.app/v1/user/${req.body.user_id}/leagues/nfl/${req.body.season}`)

        const now = new Date()
        const cutoff = req.body.season === state.league_season ? new Date(new Date() - (6 * 60 * 60 * 1000)) : new Date(now.getFullYear(), 0, 1)
        const league_ids = leagues.data.map(league => league.league_id)

        let leagues_user_db = await League.findAll({
            where: {
                league_id: {
                    [Op.in]: league_ids
                }
            }
        })

        leagues_user_db = leagues_user_db.map(league => league.dataValues)


        const leagues_updated = leagues_user_db.filter(l_db => l_db.updatedAt >= cutoff || state.league_season > req.body.season)
        const leagues_to_update = leagues_user_db.filter(l_db => l_db.updatedAt < cutoff && state.league_season === req.body.season).map(league => league.league_id)
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
                .filter(league => league.userRoster?.players?.length > 0 || league.drafts.find(d => ['drafting', 'paused'].includes(d.status)))
                .sort((a, b) => a.index - b.index)
        )

        LeagueCache.set(`${req.body.user_id}_${req.body.season}`, leagues_all, 60 * 60)

        if (state.league_season === req.body.season) {
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
        }

        let still_syncing = app.get('syncing')
        app.set('syncing', still_syncing -= 1)

        res.send(leagues_all)
    }
}

exports.draft = async (req, res, app) => {
    const league_drafts = await axios.get(`https://api.sleeper.app/v1/league/${req.body.league_id}/drafts`)
    const active_draft = league_drafts.data?.find(d => d.settings.slots_k > 0)

    if (active_draft) {
        const allplayers = app.get('allplayers')
        const draft_picks = await axios.get(`https://api.sleeper.app/v1/draft/${active_draft.draft_id}/picks`)
        const users = await axios.get(`https://api.sleeper.app/v1/league/${req.body.league_id}/users`)
        const teams = Object.keys(active_draft.draft_order).length

        const picktracker = draft_picks.data.filter(pick => pick.metadata.position === "K").map((pick, index) => {
            return {
                pick: Math.floor(index / teams) + 1 + "." + ((index % teams) + 1).toLocaleString("en-US", { minimumIntegerDigits: 2 }),
                player: allplayers[pick.player_id].full_name,
                player_id: pick.player_id,
                picked_by: users.data.find(u => u.user_id === pick.picked_by)?.display_name,
                picked_by_avatar: users.data.find(u => u.user_id === pick.picked_by)?.avatar
            }
        })

        res.send(picktracker)

    } else {
        res.send([])
    }
}