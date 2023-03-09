import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { loadingIcon } from '../Functions/misc';
import { getLeagueData, getTradeTips } from '../Functions/loadData';
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
    const [stateLeaguemateIds, setStateLeaguemateIds] = useState([])



    useEffect(() => {
        const fetchLeagues = async () => {
            setIsLoading(true)
            const user = await axios.post('/user/create', {
                username: params.username,
                season: params.season
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
                        if (roster.user_id?.length > 1) {
                            return leaguemates[roster.user_id] = {
                                user_id: roster.user_id,
                                username: roster.username,
                                avatar: roster.avatar
                            }
                        }
                    })
                }).flat(2)

                const trades = await axios.post('/trade/find', {
                    leaguemate_ids: Object.keys(leaguemates),
                    user_id: user.data[0]?.user_id.toString()
                })


                const trade_finds = getTradeTips(trades.data, leagues.data, leaguemates)



                setStateTrades(trade_finds)
                setStateLeaguemateIds(leaguemates)

                setStateLeagues(leagues.data)

                const data = getLeagueData(leagues.data, user.data[0].user_id, stateState, params.season)

                setStatePlayerShares(data.players)
                setStateLeaguemates(data.leaguemates)
                setStateMatchups(data.matchups)

                const home = await axios.get('/home')
                setStateState(home.data.state)
                setStateAllPlayers(home.data.allplayers)

                setIsLoading(false)

                if (home.data.state.league_season === params.season) {

                    let i = 0;
                    let increment = 500;

                    while (i < Object.keys(leaguemates).length) {
                        await axios.post('/user/leaguemates', {
                            leaguemates: Object.keys(leaguemates).slice(i, i + increment).map(lm_id => {
                                return {
                                    ...leaguemates[lm_id],
                                    updatedAt: new Date()
                                }
                            })
                        })

                        i += increment
                    }
                }

            } else {
                setState_User(user.data)
                setIsLoading(false)
            }
            /*
                        const pc = await axios.get('/trade/rankings')
            
                        
                                  
                                               const rankings = Object.keys(pc.data.rankings)
                                                   .filter(player_id => stateAllPlayers[player_id]?.position === 'QB')
                                                   .sort((a, b) =>
                                                       pc.data.rankings[b].filter(x => x === a).length - pc.data.rankings[a].filter(x => x === b).length
                                                       || Array.from(new Set(pc.data.rankings[b])).reduce((acc, cur) => acc + pc.data.rankings[cur].length, 0) - Array.from(new Set(pc.data.rankings[a])).reduce((acc, cur) => acc + pc.data.rankings[cur].length, 0)
                                                   )
                                                   .map(player_id => {
                                                       return {
                                                           [stateAllPlayers[player_id]?.full_name]: pc.data.rankings[player_id]
                                                               .filter(player_id2 => stateAllPlayers[player_id2]?.position === 'QB')
                                                               .map(player_id2 => stateAllPlayers[player_id2]?.full_name)
                                                               .sort((a, b) => a > b ? 1 : -1)
                                                       }
                                                   })
                                                  
            
            
                        console.log(pc.data)
             */
        }
        fetchLeagues()
    }, [params.username, params.season])

    const syncLeague = async (league_id, week) => {
        let matchups = stateMatchups
        const matchups_new = await axios.post(`/league/sync`, {
            league_id: league_id,
            week: week
        })
        const index = matchups.findIndex(matchup => {
            return matchup.league.league_id === league_id
        })
        matchups[index][`matchups_${week}`] = matchups_new.data
        setStateMatchups([...matchups])
    }

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
                        stateLeaguemateIds={stateLeaguemateIds}
                        syncLeague={syncLeague}
                    />
                </React.Suspense>

        }

    </>
}

export default Main;