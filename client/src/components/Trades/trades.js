import axios from 'axios';
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TableTrades from "../Home/tableTrades";
import Search from "../Home/search";
import TradeInfo from "./tradeInfo";

const Trades = ({
    propTrades,
    stateAllPlayers
}) => {
    const params = useParams();
    const [stateTrades, setStateTrades] = useState([])
    const [stateTradesFiltered, setStateTradesFiltered] = useState([])
    const [page, setPage] = useState(1)
    const [itemActive, setItemActive] = useState('');
    const [searched_manager, setSearched_Manager] = useState('')
    const [searched_manager2, setSearched_Manager2] = useState('')
    const [searched_player, setSearched_Player] = useState('')
    const [searched_player2, setSearched_Player2] = useState('')
    const [searched_league, setSearched_League] = useState('')
    const [filter, setFilter] = useState('All Trades')
    const [pricecheckTrades, setPricecheckTrades] = useState({})
    const [pricecheckPlayer, setPricecheckPlayer] = useState('')


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
        setStateTrades(propTrades)
    }, [params.username])


    useEffect(() => {
        setPage(1)
    }, [stateTradesFiltered, pricecheckPlayer])

    useEffect(() => {
        const filterTrades = () => {
            let trades;
            if (filter === 'All Trades') {
                trades = stateTrades
            } else {
                trades = stateTrades.filter(t => t.tips.acquire.length > 0 || t.tips.trade_away.length > 0)
            }

            let trades_filtered1;
            let trades_filtered2;
            let trades_filtered3;
            if (searched_player === '') {
                trades_filtered1 = trades
            } else {
                trades_filtered1 = trades.filter(t => Object.keys(t.adds || {}).includes(searched_player.id))
            }


            if (searched_manager === '') {
                trades_filtered2 = trades_filtered1
            } else {
                trades_filtered2 = trades_filtered1.filter(t => t.managers.find(m => m === searched_manager.id))
            }

            if (searched_player2 === '') {
                trades_filtered3 = trades_filtered2
            } else {
                trades_filtered3 = trades_filtered2.filter(t =>
                    (t.adds || {})[searched_player2.id] && (t.adds || {})[searched_player2.id] !== (t.adds || {})[searched_player.id]
                )
            }

            if (searched_league === '') {
                trades_filtered3 = trades_filtered2
            } else {
                trades_filtered3 = trades_filtered2.filter(t =>
                    t.tips.acquire.map(add => add.league.league_id).includes(searched_league.id)
                    || t.tips.trade_away.map(drop => drop.league.league_id).includes(searched_league.id)
                )
            }

            setStateTradesFiltered([...trades_filtered3])
        }

        filterTrades()
    }, [stateTrades, searched_player, searched_manager, searched_player2, searched_league, filter])


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

    const tradesDisplay = filter === 'Price Check' ? pricecheckTrades[pricecheckPlayer.id] || [] : stateTradesFiltered

    const trades_body = tradesDisplay
        .sort((a, b) => parseInt(b.status_updated) - parseInt(a.status_updated))
        .map(trade => {
            return {
                id: trade.transaction_id,
                list: [
                    [
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
                    ],
                    ...trade.managers.map(m => {
                        const roster = trade.rosters?.find(r => r.user_id === m || r.co_owners?.find(co => co.user_id === m))
                        return [

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
                    })
                ],
                secondary_table: (
                    <TradeInfo
                        trade={trade}
                        stateAllPlayers={stateAllPlayers}
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
        })

    leagues_list = Object.values(leagues_list)

    return <>
        <h4>{tradesDisplay.length} Trades</h4>
        <select
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
                    list={players_list}
                />

            </div>
            {
                filter === 'Trades with Leads' ?
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
        <TableTrades
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