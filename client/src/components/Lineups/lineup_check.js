import TableMain from '../Home/tableMain';
import { useState, useEffect } from "react";
import { getLineupCheck } from '../Functions/loadData';
import Lineup from "./lineup";

const Lineup_Check = ({ stateState, stateAllPlayers, state_user, stateMatchups, setTab, week, setWeek, syncLeague }) => {
    const [itemActive, setItemActive] = useState('');
    const [page, setPage] = useState(1)
    const [searched, setSearched] = useState('')

    useEffect(() => {
        setPage(1)
    }, [searched])

    const lineups_headers = [
        [
            {
                text: 'League',
                colSpan: 6,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: '#Slots',
                colSpan: 8,
                className: 'half'
            }
        ],
        [
            {
                text: 'Suboptimal',
                colSpan: 2,
                className: 'small half'
            },
            {
                text: 'Early in Flex',
                colSpan: 2,
                className: 'small half'
            },
            {
                text: 'Late not in Flex',
                colSpan: 2,
                className: 'small half'
            },
            {
                text: 'Non QBs in SF',
                colSpan: 2,
                className: 'small half'
            }
        ]
    ]

    const lineups_body = stateMatchups.map(matchup_league => {
        const matchup = matchup_league[`matchups_${stateState.week}`]?.find(x => x.roster_id === matchup_league.league.userRoster.roster_id)

        const opponentMatchup = matchup?.matchup_id ? matchup_league[`matchups_${stateState.week}`]?.find(x => x.matchup_id === matchup.matchup_id && x.roster_id !== matchup?.roster_id) : null
        let opponent;
        if (opponentMatchup) {
            const opponentRoster = matchup_league.league.rosters.find(r => r?.roster_id === opponentMatchup?.roster_id)
            const opponentInfo = matchup_league.league.users.find(u => u.user_id === opponentRoster?.owner_id)
            opponent = {
                user: opponentInfo,
                roster: opponentRoster,
                matchup: opponentMatchup
            }
        }
        let lineups = matchup ? getLineupCheck(matchup, matchup_league.league, stateAllPlayers) : null
        const optimal_lineup = lineups?.optimal_lineup
        const lineup_check = lineups?.lineup_check
        const starting_slots = lineups?.starting_slots
        const players_points = { ...lineups?.players_points, ...opponentMatchup?.players_points }



        return {
            id: matchup_league.league.league_id,
            search: {
                text: matchup_league.league.name,
                image: {
                    src: matchup_league.league.avatar,
                    alt: matchup_league.league.name,
                    type: 'league'
                }
            },
            list: [
                {
                    text: matchup_league.league.name,
                    colSpan: 6,
                    className: 'left',
                    image: {
                        src: matchup_league.league.avatar,
                        alt: matchup_league.league.name,
                        type: 'league'
                    }
                },
                {
                    text: !matchup?.matchup_id ? '-' : lineup_check.filter(x => x.notInOptimal).length > 0 ?
                        lineup_check.filter(x => x.notInOptimal).length :
                        '√',
                    colSpan: 2,
                    className: !matchup?.matchup_id ? '' : lineup_check.filter(x => x.notInOptimal).length > 0 ?
                        'red' : 'green'
                },
                {
                    text: !matchup?.matchup_id ? '-' : lineup_check.filter(x => x.earlyInFlex).length > 0 ?
                        lineup_check.filter(x => x.earlyInFlex).length :
                        '√',
                    colSpan: 2,
                    className: !matchup?.matchup_id ? '' : lineup_check.filter(x => x.earlyInFlex).length > 0 ?
                        'red' : 'green'
                },
                {
                    text: !matchup?.matchup_id ? '-' : lineup_check.filter(x => x.lateNotInFlex).length > 0 ?
                        lineup_check.filter(x => x.lateNotInFlex).length :
                        '√',
                    colSpan: 2,
                    className: !matchup?.matchup_id ? '' : lineup_check.filter(x => x.lateNotInFlex).length > 0 ?
                        'red' : 'green'
                },
                {
                    text: !matchup?.matchup_id ? '-' : lineup_check.filter(x => x.nonQBinSF).length > 0 ?
                        lineup_check.filter(x => x.nonQBinSF).length :
                        '√',
                    colSpan: 2,
                    className: !matchup?.matchup_id ? '' : lineup_check.filter(x => x.nonQBinSF).length > 0 ?
                        'red' : 'green'
                }
            ],
            secondary_table: (
                <Lineup
                    matchup={matchup}
                    opponent={opponent}
                    starting_slots={starting_slots}
                    league={matchup_league.league}
                    optimal_lineup={optimal_lineup}
                    players_points={players_points}
                    stateAllPlayers={stateAllPlayers}
                    state_user={state_user}
                    lineup_check={lineup_check}
                    syncLeague={syncLeague}
                    searched={searched}
                    setSearched={setSearched}
                />
            )
        }
    })

    const caption = (
        <div className="primary nav">
            <select
                className='click'
                onChange={(e) => setWeek(e.target.value)}
            >
                {
                    Array.from(Array(week).keys()).map(key =>
                        <option>
                            {
                                `Week ${key + 1}`
                            }
                        </option>
                    )
                }
            </select>
            <select
                className={'click'}
                onChange={(e) => setTab(e.target.value)}
            >
                <option>Lineup Check</option>
                <option>Rankings</option>
            </select>
            <i className="fa-regular fa-rectangle-list"></i>
        </div>
    )

    return <>
        {caption}
        <TableMain
            id={'Lineups'}
            type={'main'}
            headers={lineups_headers}
            body={lineups_body}
            page={page}
            setPage={setPage}
            itemActive={itemActive}
            setItemActive={setItemActive}
            search={true}
            searched={searched}
            setSearched={setSearched}
        />
    </>
}

export default Lineup_Check;