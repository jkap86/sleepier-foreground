import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { loadingIcon } from '../Functions/misc';
import { getLeagueData } from '../Functions/loadData';
import View from "./view";

const Main = () => {
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [stateState, setStateState] = useState({})
    const [stateAllPlayers, setStateAllPlayers] = useState({});
    const [state_user, setState_User] = useState(false);
    const [stateLeagues, setStateLeagues] = useState([]);
    const [stateLeaguemates, setStateLeaguemates] = useState([]);
    const [statePlayerShares, setStatePlayerShares] = useState([]);
    const [stateMatchups, setStateMatchups] = useState([]);
    const [stateTrades, setStateTrades] = useState([]);

    useEffect(() => {
        const fetchLeagues = async () => {
            setIsLoading(true)
            const user = await axios.post('/user/create', {
                username: params.username
            })

            if (!user.data?.error) {
                setState_User(user.data[0])
                const leagues = await axios.post('/league/create', {
                    user_id: user.data[0]?.user_id.toString(),
                    season: params.season
                })

                let leaguemates = {}

                leagues.data.map(league => {
                    return league.rosters.map(roster => {
                        return leaguemates[roster.user_id] = {
                            user_id: roster.user_id,
                            username: roster.username,
                            avatar: roster.avatar
                        }
                    })
                }).flat(2)

                const trades = await axios.post('/trade/find', {
                    leaguemate_ids: Object.keys(leaguemates)
                })


                const trade_finds = trades.data
                    .map(trade => {

                        let acquire = []

                        Object.keys(trade.adds || {}).map(add => {
                            const lm_user_id = trade.adds[add]

                            return leagues.data.filter(league => league.users.includes(lm_user_id) && league.userRoster.user_id !== lm_user_id && league.userRoster.players.includes(add))
                                .map(league => {
                                    return acquire.push({
                                        player_id: add,
                                        manager: {
                                            user_id: lm_user_id,
                                            username: leaguemates[lm_user_id]?.username,
                                            avatar: leaguemates[lm_user_id]?.avatar
                                        },
                                        league: {
                                            league_id: league.league_id,
                                            name: league.name,
                                            avatar: league.avatar
                                        }
                                    })
                                })
                        })

                        let trade_away = []

                        Object.keys(trade.drops || {}).map(drop => {
                            const lm_user_id = trade.drops[drop]

                            return leagues.data
                                .filter(league =>
                                    league.users.includes(lm_user_id) && league.userRoster.user_id !== lm_user_id
                                    && league.rosters?.find(r => r.user_id === lm_user_id || r.co_owners?.find(co => co.user_id === lm_user_id))?.players?.includes(drop)
                                )
                                .map(league => {
                                    return trade_away.push({
                                        player_id: drop,
                                        manager: {
                                            user_id: lm_user_id,
                                            username: leaguemates[lm_user_id]?.username,
                                            avatar: leaguemates[lm_user_id]?.avatar
                                        },
                                        league: {
                                            league_id: league.league_id,
                                            name: league.name,
                                            avatar: league.avatar
                                        }
                                    })
                                })
                        })

                        return {
                            ...trade,
                            tips: {
                                acquire: acquire,
                                trade_away: trade_away
                            }
                        }
                    })

                console.log(trade_finds.filter(t => t.tips.trade_away.length > 0 || t.tips.acquire.length > 0))
                setStateTrades(trade_finds)

                setStateLeagues(leagues.data)

                const data = getLeagueData(leagues.data, user.data[0].user_id, stateState, params.season)

                setStatePlayerShares(data.players)
                setStateLeaguemates(data.leaguemates)
                setStateMatchups(data.matchups)

                const home = await axios.get('/home')
                setStateState(home.data.state)
                setStateAllPlayers(home.data.allplayers)

            } else {
                setState_User(user.data)
            }
            setIsLoading(false)
        }
        fetchLeagues()
    }, [params.username, params.season])


    return <>
        {
            isLoading || !state_user ?
                <div className="loading">
                    <h1 className="loading">
                        {isLoading && loadingIcon}
                    </h1>
                </div>
                : state_user.error ||
                <React.Suspense fallback={loadingIcon}>
                    <View
                        stateState={stateState}
                        stateAllPlayers={stateAllPlayers}
                        state_user={state_user}
                        stateLeagues={stateLeagues}
                        stateLeaguemates={stateLeaguemates}
                        statePlayerShares={statePlayerShares}
                        stateMatchups={stateMatchups}
                        stateTrades={stateTrades}
                    />
                </React.Suspense>

        }

    </>
}

export default Main;