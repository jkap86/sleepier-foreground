import { useState } from "react";
import TableMain from "../Home/tableMain";
import { days, default_scoring_settings, scoring_settings_display } from '../Functions/misc';
import { Link } from "react-router-dom";


const LeagueInfo = ({
    stateAllPlayers,
    league,
    scoring_settings
}) => {
    const [itemActive, setItemActive] = useState('');
    const [secondaryContent, setSecondaryContent] = useState('Lineup')

    console.log({
        league: league
    })

    const active_roster = league.rosters.find(x => x.roster_id === itemActive)

    const standings_headers = [
        [
            {
                text: 'Manager',
                colSpan: 5,
            },
            {
                text: 'Record',
                colSpan: 2,
            },
            {
                text: 'FP',
                colSpan: 3
            }
        ]
    ]

    const standings_body = league.rosters
        .sort((a, b) => b.settings.wins - a.settings.wins || b.settings.fpts - a.settings.fpts)
        .map((team, index) => {
            return {
                id: team.roster_id,
                list: [
                    {
                        text: team.username || 'Orphan',
                        colSpan: 5,
                        className: 'left',
                        image: {
                            src: team.avatar,
                            alt: 'user avatar',
                            type: 'user'
                        }
                    },
                    {
                        text: team.settings.wins + '-' + team.settings.losses + (team.settings.ties > 0 ? '-' + team.settings.ties : ''),
                        colSpan: 2
                    },
                    {
                        text: (
                            parseFloat(team.settings.fpts + '.' + (team.settings.fpts_decimal || '00'))
                        ).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
                        colSpan: 3
                    }
                ]
            }
        })

    const leagueInfo_headers = !active_roster ? [] : [
        [
            {
                text: 'Slot',
                colSpan: 5,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: 'Player',
                colSpan: 12,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: 'Age',
                colSpan: 5,
                rowSpan: 2,
                className: 'half'
            }
        ]
    ]

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

    const display = active_roster?.players ?
        secondaryContent === 'Lineup' ? [...active_roster?.starters, ...active_roster?.players?.filter(p => !active_roster?.starters?.includes(p))] || []
            : secondaryContent === 'QBs' ? active_roster?.players?.filter(x => stateAllPlayers[x]?.position === 'QB') || []
                : secondaryContent === 'RBs' ? active_roster?.players?.filter(x => stateAllPlayers[x]?.position === 'RB') || []
                    : secondaryContent === 'WRs' ? active_roster?.players?.filter(x => stateAllPlayers[x]?.position === 'WR') || []
                        : secondaryContent === 'TEs' ? active_roster?.players?.filter(x => stateAllPlayers[x]?.position === 'TE') || []
                            : []
        : []

    const picks_body = active_roster?.draft_picks
        .sort((a, b) => a.season - b.season || a.round - b.round || a.order - b.order)
        .map(pick => {
            return {
                id: `${pick.season}_${pick.round}_${pick.original_user.user_id}`,
                list: [
                    {
                        text: <span>&nbsp;&nbsp;{`${pick.season} Round ${pick.round}${(pick.order && parseInt(league.season) === pick.season) ? `.${pick.order.toLocaleString("en-US", { minimumIntegerDigits: 2 })}` : pick.original_user.user_id === active_roster?.user_id ? '' : `(${pick.original_user?.username || 'Orphan'})`}`.toString()}</span>,
                        colSpan: 22,
                        className: 'left'
                    }
                ]

            }
        })

    const players_body = display.map((starter, index) => {
        return {
            id: starter,
            list: [
                {
                    text: secondaryContent === 'Lineup' ? (position_abbrev[league.roster_positions[index]] || 'BN')
                        : stateAllPlayers[starter]?.position,
                    colSpan: 5
                },
                {
                    text: stateAllPlayers[starter]?.full_name || 'Empty',
                    colSpan: 12,
                    className: 'left',
                    image: {
                        src: starter,
                        alt: 'player headshot',
                        type: 'player'
                    }
                },
                {
                    text: stateAllPlayers[starter]?.age || '-',
                    colSpan: 5
                }
            ]
        }
    })

    const leagueInfo_body = active_roster && secondaryContent !== 'Picks' ?
        players_body
        : active_roster && secondaryContent === 'Picks' ?
            picks_body
            : [
                {
                    id: 'Type',
                    list: [
                        {
                            text: league.settings['type'] === 2 ? 'Dynasty'
                                : league.settings['type'] === 1 ? 'Keeper'
                                    : 'Redraft',
                            colSpan: 11
                        },
                        {
                            text: league.settings['best_ball'] === 1 ? 'Bestball' : 'Standard',
                            colSpan: 11
                        },
                    ]
                }, (league.userRoster && {
                    id: 'Trade Deadline',
                    list: [
                        {
                            text: 'Trade Deadline',
                            colSpan: 11
                        },
                        {
                            text: 'Week ' + league.settings['trade_deadline'],
                            colSpan: 11
                        }
                    ]
                }),
                (league.userRoster && {
                    id: 'Daily Waivers',
                    list: [
                        {
                            text: 'Waivers',
                            colSpan: 11
                        },
                        {
                            text: `${days[league.settings['waiver_day_of_week']]} 
                                ${league.settings['daily_waivers_hour'] > 12 ? (league.settings['daily_waivers_hour'] - 12) + ' pm' : (league.settings['daily_waivers_hour'] || '12') + 'am'} `,
                            colSpan: 11
                        }
                    ]
                }),
                ...(scoring_settings
                    && Object.keys(scoring_settings)
                        .filter(setting => (scoring_settings[setting] !== default_scoring_settings[setting] || scoring_settings_display.includes(setting)))
                        .map(setting => {
                            return {
                                id: setting,
                                list: [
                                    {
                                        text: setting,
                                        colSpan: 11
                                    },
                                    {
                                        text: scoring_settings[setting].toLocaleString(),
                                        colSpan: 11
                                    }
                                ]
                            }
                        })
                )
            ]

    return <>
        <div className="secondary nav">
            <div>
                {
                    league.drafts?.find(x => x.status !== 'pre_draft' && x.rounds > 10) ?
                        <Link to={`/picktracker/${league.league_id}`} target='_blank'>
                            Kicker Tracker
                        </Link>
                        : null
                }
                <button className="active">Standings</button>
            </div>
            <div>
                {
                    active_roster ?
                        <>
                            <button
                                className={secondaryContent === 'Lineup' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('Lineup')}
                            >
                                Lineup
                            </button>
                            <button
                                className={secondaryContent === 'QBs' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('QBs')}
                            >
                                QBs
                            </button>
                            <button
                                className={secondaryContent === 'RBs' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('RBs')}
                            >
                                RBs
                            </button>
                            <button
                                className={secondaryContent === 'WRs' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('WRs')}
                            >
                                WRs
                            </button>
                            <button
                                className={secondaryContent === 'TEs' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('TEs')}
                            >
                                TEs
                            </button>
                            <button
                                className={secondaryContent === 'Picks' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('Picks')}
                            >
                                Picks
                            </button>
                        </>
                        :
                        <button className="active">
                            Settings
                        </button>
                }
            </div>
        </div>
        <TableMain
            type={'secondary subs'}
            headers={standings_headers}
            body={standings_body}
            itemActive={itemActive}
            setItemActive={setItemActive}
        />
        <TableMain
            type={'secondary lineup'}
            headers={leagueInfo_headers}
            body={leagueInfo_body}
        />
    </>
}

export default LeagueInfo;