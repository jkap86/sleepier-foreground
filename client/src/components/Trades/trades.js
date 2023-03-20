import axios from 'axios';
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import TableTrades from "../Home/tableTrades";
import Search from "../Home/search";
import TradeInfo from "./tradeInfo";
import { getMonthName } from '../Functions/misc';
import { getTradeTips } from '../Functions/loadData';
import TableMain from '../Home/tableMain';

const Trades = ({
    stateState,
    state_user,
    propTrades,
    stateAllPlayers,
    stateLeaguemateIds,
    stateLeagues
}) => {
    const params = useParams();
    const [stateTrades, setStateTrades] = useState({})
    const [stateTradesFiltered, setStateTradesFiltered] = useState([])
    const [page, setPage] = useState(1)
    const [itemActive, setItemActive] = useState('');
    const [searched_manager, setSearched_Manager] = useState('')
    const [searched_manager2, setSearched_Manager2] = useState('')
    const [searched_player, setSearched_Player] = useState('')
    const [searched_player2, setSearched_Player2] = useState('')
    const [searched_league, setSearched_League] = useState('')
    const [searched_month, setSearched_Month] = useState()
    const [filter, setFilter] = useState('All Trades')
    const [pricecheckTrades, setPricecheckTrades] = useState({})
    const [pricecheckPlayer, setPricecheckPlayer] = useState('')
    const [pricecheckPlayer2, setPricecheckPlayer2] = useState('')

    console.log({
        trades: stateTradesFiltered.filter(x => x.tips.acquire.find(y => y.type === 'pick'))
    })

    useEffect(() => {
        if (!searched_month) {
            let now = new Date()
            const month = now.getMonth()
            setSearched_Month(month)

            const trades = stateTrades
            setStateTrades({
                ...trades,
                [month]: propTrades
            })
        } else if (!stateTrades[searched_month]) {
            const trades = stateTrades
            const fetchMonthTrades = async () => {
                const trades_db = await axios.post('/trade/find', {
                    leaguemate_ids: Object.keys(stateLeaguemateIds),
                    user_id: state_user.user_id,
                    month: searched_month
                })

                const trade_finds = getTradeTips(trades_db.data, stateLeagues, stateLeaguemateIds)

                setStateTrades({
                    ...trades,
                    [searched_month]: trade_finds
                })
            }

            fetchMonthTrades()
        }
    }, [params.username, searched_month])


    useEffect(() => {

        const fetchPlayerTrades = async () => {
            let pcTrades = pricecheckTrades

            if (!pcTrades[pricecheckPlayer.id]) {
                const player_trades = await axios.post('/trade/pricecheck', {
                    player_id: pricecheckPlayer.id
                })
                pcTrades[pricecheckPlayer.id] = player_trades.data
                setPricecheckTrades({ ...pcTrades })
            }
        }
        if (pricecheckPlayer !== '') {
            fetchPlayerTrades()
        }

    }, [pricecheckPlayer])


    useEffect(() => {
        setPage(1)
    }, [stateTradesFiltered, pricecheckPlayer])

    useEffect(() => {
        const filterTrades = () => {
            if (stateTrades[searched_month]) {
                let trades;
                if (filter === 'All Trades') {
                    trades = stateTrades[searched_month]
                } else {
                    trades = stateTrades[searched_month].filter(t => t.tips.acquire.length > 0 || t.tips.trade_away.length > 0)
                }

                let trades_filtered1;
                let trades_filtered2;
                let trades_filtered3;
                if (searched_player === '') {
                    trades_filtered1 = trades
                } else {
                    if (filter === 'All Trades') {
                        trades_filtered1 = trades.filter(t => (
                            Object.keys(t.adds || {}).includes(searched_player.id)
                            || t.draft_picks.find(pick => `${pick.season} ${pick.round}.${pick.order?.toLocaleString("en-US", { minimumIntegerDigits: 2 })}` === searched_player.id)
                        ))
                    } else {
                        trades_filtered1 = trades.filter(t =>
                            t.tips.trade_away.find(
                                pick => pick.player_id.season + ((pick.player_id.order && parseInt(pick.player_id.season) === parseInt(params.season)) ?
                                    ` ${pick.player_id.round}.${pick.player_id.order?.toLocaleString("en-US", { minimumIntegerDigits: 2 })}`
                                    : ` Round ${pick.round}`
                                ) === searched_player.id
                            )
                            ||
                            t.tips.acquire.find(
                                pick => pick.player_id.season + ((pick.player_id.order && parseInt(pick.player_id.season) === parseInt(params.season)) ?
                                    ` ${pick.player_id.round}.${pick.player_id.order?.toLocaleString("en-US", { minimumIntegerDigits: 2 })}`
                                    : ` Round ${pick.round}`
                                ) === searched_player.id
                            )
                        )
                    }
                }


                if (searched_manager === '') {
                    trades_filtered2 = trades_filtered1
                } else {
                    trades_filtered2 = trades_filtered1.filter(t => t.managers.find(m => m === searched_manager.id))
                }

                if (searched_player2 === '') {
                    trades_filtered3 = trades_filtered2
                } else {
                    trades_filtered3 = trades_filtered2.filter(t => (
                        (t.adds || {})[searched_player2.id] && (t.adds || {})[searched_player2.id] !== (t.adds || {})[searched_player.id]
                        || t.draft_picks.find(pick => `${pick.season}_${pick.round}_${pick.order?.toLocaleString("en-US", { minimumIntegerDigits: 2 })}` === searched_player.id)
                    ))
                }

                if (searched_league === '') {
                    trades_filtered3 = trades_filtered2
                } else {
                    if (filter === 'All Trades') {
                        trades_filtered3 = trades_filtered2.filter(t => t.league.league_id === searched_league.id)
                    } else {
                        trades_filtered3 = trades_filtered2.filter(t =>
                            t.tips.acquire.map(add => add.league.league_id).includes(searched_league.id)
                            || t.tips.trade_away.map(drop => drop.league.league_id).includes(searched_league.id)
                        )
                    }
                }

                setStateTradesFiltered([...trades_filtered3])
            }
        }

        filterTrades()
    }, [stateTrades[searched_month], searched_player, searched_manager, searched_player2, searched_league, filter])


    const trades_headers = [
        [
            {
                text: 'Date',
                colSpan: 2
            },
            {
                text: 'League',
                colSpan: 6
            }
        ]
    ]

    const tradesDisplay = filter === 'Price Check' ?
        pricecheckTrades[pricecheckPlayer.id]
            ?.filter(
                trade => Object.keys(trade.adds || {}).includes(pricecheckPlayer2.id) || pricecheckPlayer2 === ''
                    || trade.draft_picks?.find(pick => (`${pick.season}_${pick.round}_${pick.order?.toLocaleString("en-US", { minimumIntegerDigits: 2 })}`) === pricecheckPlayer2.id)
            ) || []
        : stateTradesFiltered

    const trades_body = tradesDisplay
        .sort((a, b) => parseInt(b.status_updated) - parseInt(a.status_updated))
        .map(trade => {
            return {
                id: trade.transaction_id,
                list: [

                    {
                        text: <TableMain
                            type={'trade_summary'}
                            headers={[]}
                            body={
                                [
                                    {
                                        id: 'title',
                                        list: [
                                            {
                                                text: new Date(parseInt(trade.status_updated)).toLocaleDateString('en-US') + ' ' + new Date(parseInt(trade.status_updated)).toLocaleTimeString('en-US', { hour: "2-digit", minute: "2-digit" }),
                                                colSpan: 2,
                                                className: 'small'
                                            },
                                            {
                                                text: trade.league.name,
                                                colSpan: 6,

                                                image: {
                                                    src: trade.league.avatar,
                                                    alt: 'league avatar',
                                                    type: 'league'
                                                }
                                            },
                                        ]
                                    },
                                    ...trade.managers.map(m => {
                                        const roster = trade.rosters?.find(r => r.user_id === m || r.co_owners?.find(co => co.user_id === m))
                                        return {
                                            id: m,
                                            list: [

                                                {
                                                    text: roster?.username || 'Orphan',
                                                    colSpan: 2,
                                                    className: 'left',
                                                    image: {
                                                        src: roster?.avatar,
                                                        alt: 'user avatar',
                                                        type: 'user'
                                                    }
                                                },
                                                {
                                                    text: <ol>
                                                        {
                                                            Object.keys(trade.adds || {}).filter(a => trade.adds[a] === roster?.user_id).map(player_id =>
                                                                <li>+ {stateAllPlayers[player_id]?.full_name}</li>
                                                            )
                                                        }
                                                        {
                                                            trade.draft_picks
                                                                .filter(p => p.owner_id === roster?.roster_id)
                                                                .sort((a, b) => (a.season) - b.season || a.round - b.round)
                                                                .map(pick =>
                                                                    <li>
                                                                        {
                                                                            `+ ${pick.season} Round ${pick.round}${pick.order && pick.season === params.season ? `.${pick.order.toLocaleString("en-US", { minimumIntegerDigits: 2 })}` : ` (${pick.original_user?.username || 'Orphan'})`}`
                                                                        }
                                                                    </li>
                                                                )
                                                        }
                                                    </ol>,
                                                    colSpan: 3,
                                                    className: 'small left'
                                                },
                                                {
                                                    text: <ol>
                                                        {
                                                            Object.keys(trade.drops || {}).filter(d => trade.drops[d] === roster?.user_id).map(player_id =>

                                                                <li className="end">
                                                                    <span className='end'>
                                                                        {
                                                                            (`- ${stateAllPlayers[player_id]?.full_name}`).toString()
                                                                        }
                                                                    </span>
                                                                </li>

                                                            )
                                                        }
                                                        {
                                                            trade.draft_picks
                                                                .filter(p => p.previous_owner_id === roster?.roster_id)
                                                                .sort((a, b) => (a.season) - b.season || a.round - b.round)
                                                                .map(pick =>
                                                                    <li className="end">
                                                                        <span className="end">
                                                                            {
                                                                                (`- ${pick.season} Round ${pick.round}${pick.order && pick.season === params.season ? `.${pick.order.toLocaleString("en-US", { minimumIntegerDigits: 2 })}` : ` (${pick.original_user?.username || 'Orphan'})`}`).toString()
                                                                            }
                                                                        </span>
                                                                    </li>
                                                                )
                                                        }
                                                    </ol>,
                                                    colSpan: 3,
                                                    className: 'small left'
                                                }
                                            ]
                                        }
                                    })

                                ]
                            }
                        />,
                        colSpan: 8,
                        className: 'small'
                    }

                ],
                secondary_table: (
                    <TradeInfo
                        trade={trade}
                        stateAllPlayers={stateAllPlayers}
                        stateState={stateState}
                        state_user={state_user}
                    />
                )
            }
        })



    const players_list = Array.from(
        new Set(
            stateTradesFiltered.map(trade => Object.keys(trade.adds || {})).flat()
        )
    ).map(player_id => {
        return {
            id: player_id,
            text: stateAllPlayers[player_id]?.full_name,
            image: {
                src: player_id,
                alt: 'player headshot',
                type: 'player'
            }
        }
    })

    const picks_list = Array.from(
        new Set(
            stateTradesFiltered.map(trade => trade.draft_picks?.map(
                pick => pick.season + ((pick.order && parseInt(pick.season) === parseInt(params.season)) ?
                    ` ${pick.round}.${pick.order?.toLocaleString("en-US", { minimumIntegerDigits: 2 })}`
                    : ` Round ${pick.round}`
                )
            )).flat(2)
        )
    ).map(pick => {
        const pick_split = pick.split('_')
        return {
            id: pick,
            text: pick,
            image: {
                src: null,
                alt: 'pick headshot',
                type: 'player'
            }
        }
    })

    const players_list2 = [...Array.from(
        new Set(
            pricecheckTrades[pricecheckPlayer.id]?.map(trade => Object.keys(trade.adds || {})).flat()
        )
    )
        .filter(player_id => player_id !== pricecheckPlayer.id)
        .map(player_id => {
            return {
                id: player_id,
                text: stateAllPlayers[player_id]?.full_name,
                image: {
                    src: player_id,
                    alt: 'player headshot',
                    type: 'player'
                }
            }
        }),
    ...Array.from(
        new Set(
            pricecheckTrades[pricecheckPlayer.id]?.map(trade => trade.draft_picks?.map(pick => `${pick.season}_${pick.round}_${pick.order?.toLocaleString("en-US", { minimumIntegerDigits: 2 })}`)).flat(2)
        )
    )
        .map(pick => {
            const pick_split = pick.split('_')
            return {
                id: pick,
                text: pick_split[0] + (
                    parseInt(pick_split[2]) && pick_split[0] === params.season ?
                        ` ${pick_split[1]}.${pick_split[2].toLocaleString("en-US", { minimumIntegerDigits: 2 })}`
                        : ` Round ${pick_split[1]}`
                ),
                image: {
                    src: null,
                    alt: 'pick headshot',
                    type: 'player'
                }
            }
        })
        .filter(x => x.text !== pricecheckPlayer.text)
    ]

    let managers_dict = {}

    stateTradesFiltered.map(trade => {
        return trade.managers.map(manager => {
            const roster = trade.rosters?.find(r => r.user_id === manager || r.co_owners?.find(co => co.user_id === manager))
            return managers_dict[roster?.user_id] = {
                username: roster?.username,
                avatar: roster?.avatar
            }
        })
    })

    let managers_list = Object.keys(managers_dict).map(user_id => {
        return {
            id: user_id,
            text: managers_dict[user_id].username,
            image: {
                src: managers_dict[user_id].avatar,
                alt: 'user avatar',
                type: 'user'
            }
        }
    })


    let leagues_list = {}

    stateTradesFiltered
        .map(trade => {
            if (filter === 'All Trades') {
                leagues_list[trade.league.league_id] = {
                    id: trade.league.league_id,
                    text: trade.league.name,
                    image: {
                        src: trade.league.avatar,
                        alt: 'league avatar',
                        type: 'league'
                    }
                }
            } else {
                trade.tips.acquire.map(add => {
                    leagues_list[add.league.league_id] = {
                        id: add.league.league_id,
                        text: add.league.name,
                        image: {
                            src: add.league.avatar,
                            alt: 'league avatar',
                            type: 'league'
                        }
                    }
                })
                trade.tips.trade_away.map(drop => {
                    leagues_list[drop.league.league_id] = {
                        id: drop.league.league_id,
                        text: drop.league.name,
                        image: {
                            src: drop.league.avatar,
                            alt: 'league avatar',
                            type: 'league'
                        }
                    }
                })
            }
        })

    leagues_list = Object.values(leagues_list)

    return <>
        <h2>
            {searched_player.id}
            {tradesDisplay.length.toLocaleString("en-US")}

            <select
                onChange={(e) => setSearched_Month(e.target.value)}
                value={searched_month}
            >
                {
                    Array.from(Array(12).keys()).map(key =>
                        <option key={key} value={key}>{getMonthName(key)}</option>
                    )
                }
            </select>
            {` ${params.season} Trades`}

        </h2>
        <select
            className='trades'
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
        >
            <option>All Trades</option>
            <option>Trades with Leads</option>
            <option>Price Check</option>
        </select>
        <div className="trade_search_wrapper">
            <div>
                {
                    filter === 'Price Check' ? null :

                        <Search
                            id={'By Manager'}
                            sendSearched={(data) => setSearched_Manager(data)}
                            placeholder={`Manager`}
                            list={managers_list}
                        />
                }
                <Search
                    id={'By Player'}
                    sendSearched={(data) => filter === 'Price Check' ? setPricecheckPlayer(data) : setSearched_Player(data)}
                    placeholder={`Player`}
                    list={[...players_list, ...picks_list].flat()}
                />
                {
                    filter !== 'Price Check' || pricecheckPlayer === '' ? null :
                        <Search
                            id={'By Player2'}
                            sendSearched={(data) => setPricecheckPlayer2(data)}
                            placeholder={'Player 2'}
                            list={players_list2}
                        />
                }

            </div>
            {
                ['All Trades', 'Trades with Leads'].includes(filter) ?
                    <div>

                        <Search
                            id={'By League'}
                            sendSearched={(data) => setSearched_League(data)}
                            placeholder={`League`}
                            list={leagues_list}
                        />
                    </div>
                    : null
            }
            {
                filter === 'Trades with Leads' ?
                    <h2>Filtered Leaguemate trades for Potential Acquisitions/Flips</h2>
                    : filter === 'Price Check'
                        ? <h2>All trades with only that player on one side</h2>
                        : <h2>All Leaguemate Trades</h2>

            }

        </div>
        <TableMain
            id={'trades'}
            type={'main'}
            headers={trades_headers}
            body={trades_body}
            page={page}
            setPage={setPage}
            itemActive={itemActive}
            setItemActive={setItemActive}
        />
    </>
}

export default Trades;