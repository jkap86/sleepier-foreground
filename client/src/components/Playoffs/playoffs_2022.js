import React, { useEffect, useState } from "react";
import axios, { all } from 'axios';
import { useParams } from "react-router-dom";
import TableMain from "../Home/tableMain";
import PlayoffsBreakdown from "./playoffs_breakdown";
import { team_abbrev } from '../Functions/misc';

const Playoffs = () => {
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false)
    const [league, setLeague] = useState({})
    const [scoring, setScoring] = useState({})
    const [itemActive, setItemActive] = useState('');

    const [allplayers, setAllPlayers] = useState({})
    const [stateWeek, setStateWeek] = useState([])
    const [optimalLineups, setOptimalLineups] = useState({})

    const getPlayerScore = (player_id, w) => {
        const scoring_settings = league.league.scoring_settings

        let total_points = parseFloat(0);

        const player_breakdown = scoring[w][player_id]
        const points_week = Object.keys(player_breakdown || {})
            .filter(x => Object.keys(scoring_settings).includes(x))
            .reduce((acc, cur) => acc + parseFloat(player_breakdown[cur]) * parseFloat(scoring_settings[cur]), 0)

        total_points += parseFloat(points_week)

        return parseFloat(total_points).toFixed(2)
    }

    const getOptimalLineup = (roster, w) => {
        const position_map = {
            'QB': ['QB'],
            'RB': ['RB', 'FB'],
            'WR': ['WR'],
            'TE': ['TE'],
            'FLEX': ['RB', 'FB', 'WR', 'TE'],
            'SUPER_FLEX': ['QB', 'RB', 'FB', 'WR', 'TE'],
            'WRRB_FLEX': ['RB', 'FB', 'WR'],
            'REC_FLEX': ['WR', 'TE']
        }

        const position_abbrev = {
            'QB': 'QB',
            'RB': 'RB',
            'WR': 'WR',
            'TE': 'TE',
            'SUPER_FLEX': 'SF',
            'FLEX': 'WRT',
            'WRRB_FLEX': 'W R',
            'WRRB_WRT': 'W R',
            'REC_FLEX': 'W T'
        }

        const starting_slots = league.league.roster_positions?.filter(x => Object.keys(position_map).includes(x))

        let optimalLineup_week = []

        let players = []
        roster.players?.map(player_id => {
            players.push({
                id: player_id,
                points: getPlayerScore(player_id, w) || 0
            })
        })

        starting_slots
            ?.sort((a, b) => position_map[a].length - position_map[b].length)
            ?.map((slot, index) => {
                const slot_options = players
                    .filter(x => position_map[slot].includes(allplayers[x.id]?.position))
                    .sort((a, b) => parseFloat(b.points) - parseFloat(a.points))

                if (slot_options.length > 0) {
                    const optimal_player = slot_options[0]
                    players = players.filter(x => x.id !== optimal_player?.id)
                    optimalLineup_week.push({
                        index: league.league.roster_positions.indexOf(slot) + index,
                        slot: position_abbrev[slot],
                        player: optimal_player?.id,
                        points: optimal_player?.points || 0
                    })
                } else {
                    optimalLineup_week.push({
                        index: league.league.roster_positions.indexOf(slot) + index,
                        slot: position_abbrev[slot],
                        player: '0',
                        points: 0
                    })
                }
            })

        roster.players
            ?.filter(player_id => !optimalLineup_week.find(x => x.player === player_id))
            ?.map(player_id => {
                optimalLineup_week.push({
                    index: teams_eliminated.includes(allplayers[player_id]?.team) ? 1000 : 999,
                    slot: 'BN',
                    player: player_id,
                    points: 0
                })
            })

        return optimalLineup_week
    }

    const week_sorted = league.schedule && stateWeek.sort((a, b) => league.schedule[a][0].kickoff - league.schedule[b][0].kickoff)
    const start_week = week_sorted && week_sorted[0]
    const end_week = week_sorted && week_sorted[week_sorted.length - 1]

    const getWeekTeams = (week) => {
        let teams_left = []
        league.schedule && league.schedule[week]
            ?.map(matchup => {
                matchup.team.map(t => {
                    return teams_left.push(team_abbrev[t.id] || t.id)
                })
            })
            ?.flat()
        return teams_left
    }

    const teams_all = getWeekTeams('Week_18')
    const playoff_teams = [...getWeekTeams('WC'), 'PHI', 'KC']

    const getTeamsEliminated = () => {
        let teams_eliminated = []

        stateWeek.map(week => {
            if (week === 'Week_18') {
                teams_eliminated = teams_all.filter(x => !playoff_teams.includes(x))
            } else {
                league.schedule && league.schedule[week]
                    ?.map(matchup => {
                        if (matchup.gameSecondsRemaining === '0') {
                            const t = matchup.team.sort((a, b) => parseInt(a.score) - parseInt(b.score))[0]
                            return teams_eliminated.push(team_abbrev[t?.id] || t?.id)
                        }
                    })
            }
        })
        return teams_eliminated
    }


    let teams = start_week ? (start_week === 'WC' ? playoff_teams : getWeekTeams(start_week)) : teams_all
    let teams_eliminated = getTeamsEliminated()


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            const scores = await axios.get('/playoffs/scores')
            console.log(scores)
            setScoring(scores.data.scoring)
            setAllPlayers(scores.data.allplayers)
            setStateWeek(Object.keys(scores.data.scoring).filter(x => x !== 'Week_18'))
            const league_data = await axios.get('/playoffs/league', {
                params: {
                    league_id: params.league_id
                }
            })

            setLeague(league_data.data)
            console.log(league_data.data)

            setIsLoading(false)
        }
        fetchData()

        const getScoringUpdates = setInterval(async () => {
            const scores = await axios.get('/playoffs/scores')
            setScoring(scores.data.scoring)

        }, 60 * 1000)

        return () => {
            clearInterval(getScoringUpdates)
        }
    }, [params.league_id])

    useEffect(() => {
        let optimalLineups_all = {}

        league.rosters?.map(roster => {
            let optimalLineups_user = {}
            Object.keys(scoring).map(week => {
                const optimalLineup_week = getOptimalLineup(roster, week)
                optimalLineups_user[week] = optimalLineup_week
            })
            optimalLineups_all[roster.owner_id] = {
                ...optimalLineups_user,
                players: roster.players
            }
        })

        setOptimalLineups(optimalLineups_all)
    }, [league, scoring])

    const getRosterTotal = (optimal_lineup) => {
        let team_total = 0;
        stateWeek
            .map(week => {
                const week_total = optimal_lineup[week].reduce((acc, cur) => acc + parseFloat(cur.points), 0)
                team_total += week_total
            })

        return parseFloat(team_total)
    }

    const summary_headers = [
        [
            {
                text: 'Manager',
                colSpan: 3,
                rowSpan: 2
            },
            {
                text: 'Points',
                colSpan: 6
            },
            {
                text: <span>Players<br /><br />Left</span>,
                colSpan: 2,
                rowSpan: 2
            }
        ],
        [
            {
                text: 'TOTAL',
                colSpan: 2
            },
            {
                text: 'Active',
                colSpan: 2
            },
            {
                text: 'Elim',
                colSpan: 2
            }
        ]
    ]

    const summary_body = Object.keys(optimalLineups)
        .sort((a, b) => getRosterTotal(optimalLineups[b]) - getRosterTotal(optimalLineups[a]))
        .map(user_id => {
            const players_left = optimalLineups[user_id].players.filter(x => teams?.includes(allplayers[x]?.team))
            const players_eliminated = optimalLineups[user_id].players.filter(x => teams_eliminated?.includes(allplayers[x]?.team))
            let total_optimal = {}

            stateWeek.map(week => {
                optimalLineups[user_id][week]
                    .filter(x => x.player !== '0')
                    .map(slot => {
                        if (Object.keys(total_optimal).includes(slot.player)) {
                            total_optimal[slot.player].points += parseFloat(slot.points)
                        } else {
                            total_optimal[slot.player] = {
                                index: slot.index,
                                slot: slot.slot,
                                points: parseFloat(slot.points) || 0,
                                points_bench: '0.00'
                            }
                        }
                    })
            })

            return {
                id: user_id,
                list: [
                    {
                        text: league.users.find(u => u.user_id === user_id)?.display_name || '-',
                        colSpan: 3,
                        className: 'totals'
                    },
                    {
                        text: Object.keys(total_optimal).reduce((acc, cur) => acc + parseFloat(total_optimal[cur].points), 0).toFixed(2),
                        colSpan: 2,
                        className: 'totals'
                    },
                    {
                        text: Object.keys(total_optimal)
                            .filter(x => !players_eliminated.includes(x))
                            .reduce((acc, cur) => acc + total_optimal[cur].points, 0)
                            .toFixed(2),
                        colSpan: 2
                    },
                    {
                        text: Object.keys(total_optimal)
                            .filter(x => players_eliminated.includes(x))
                            .reduce((acc, cur) => acc + total_optimal[cur].points, 0)
                            .toFixed(2),
                        colSpan: 2
                    },
                    {
                        text: (players_left.length - players_eliminated.length).toString(),
                        colSpan: 2
                    }
                ],
                secondary_table: (
                    <PlayoffsBreakdown
                        total_optimal={total_optimal}
                        stateWeek={stateWeek}
                        allplayers={allplayers}
                        scoring={scoring}
                        schedule={league.schedule}
                        players_left={players_left}
                        players_eliminated={players_eliminated}
                    />
                )
            }
        })

    return isLoading ? 'Loading' : <>

        <h1>{league.league?.name}</h1>
        <span>
            {
                (start_week || '')
                    .replace('_', ' ')
                    .replace('WC', 'Wild Card Round')
                    .replace('DIV', 'Divisional Round')
                    .replace('CONf', 'Conference Championship')
                    .replace('SB', 'Super Bowl')
            }
        </span>
        {end_week === start_week ? null :
            <>
                &nbsp;--&nbsp;
                <span>
                    {
                        (end_week || '')
                            .replace('_', ' ')
                            .replace('WC', 'Wild Card Round')
                            .replace('DIV', 'Divisional Round')
                            .replace('CONf', 'Conference Championship')
                            .replace('SB', 'Super Bowl')
                    }
                </span>
            </>
        }
        <div className="primary nav">
            {
                Object.keys(scoring)
                    .sort((a, b) => scoring[a].index - scoring[b].index)
                    .map((key, index) =>
                        <button
                            key={key}
                            className={stateWeek.includes(key) ? 'active click' : 'click'}
                            onClick={stateWeek.includes(key) ? () => setStateWeek(prevState => prevState.filter(x => x !== key)) : () => setStateWeek(prevState => [...prevState, key])}
                        >
                            {key.replace('_', ' ')}
                        </button>
                    )
            }
        </div>
        <TableMain
            type={'main'}
            headers={summary_headers}
            body={summary_body}
            itemActive={itemActive}
            setItemActive={setItemActive}
        />
    </>
}

export default Playoffs;