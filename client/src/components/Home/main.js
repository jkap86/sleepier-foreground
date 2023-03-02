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
                        stateLeaguemateIds={stateLeaguemateIds}
                    />
                </React.Suspense>

        }

    </>
}

export default Main;