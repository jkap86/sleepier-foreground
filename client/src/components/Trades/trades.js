import axios from 'axios';
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import TableTrades from "../Home/tableTrades";
import Search from "../Home/search";
import TradeInfo from "./tradeInfo";
import { loadingIcon } from '../Functions/misc';
import { getTradeTips } from '../Functions/loadData';
import TableMain from '../Home/tableMain';

const Trades = ({
    stateState,
    state_user,
    stateTrades,
    setStateTrades,
    stateTradesTips,
    setStateTradesTips,
    stateAllPlayers,
    stateLeaguemateIds,
    stateLeagues
}) => {
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false)


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
    const [pricecheckPlayer2, setPricecheckPlayer2] = useState('')
    const pageRef = useRef(null)

    useEffect(() => {
        setSearched_Player('')
        setSearched_Manager('')
        setSearched_League('')
    }, [filter])

    useEffect(() => {

        const fetchTrades = async () => {
            setIsLoading(true)
            pageRef.current.focus()

            let trades;

            if (filter === 'All Trades') {
                if (!stateTrades[Math.ceil(page / 10)] || (!(searched_player === '' && searched_league === '' && searched_manager === '') && !stateTrades.searches?.find(s => s.player === searched_player.id && s.league === searched_league.id && s.manager === searched_manager.id))) {
                    trades = await axios.post('/trade/find', {
                        leaguemate_ids: Object.keys(stateLeaguemateIds),
                        user_id: state_user.user_id,
                        offset: (page - 1) * 25,
                        limit: 250,
                        player: searched_player.id,
                        manager: searched_manager.id,
                        league: searched_league.id,
                        tips: -1
                    })

                    const trade_finds = getTradeTips(trades.data.rows, stateLeagues, stateLeaguemateIds, params.season)

                    if (searched_player === '' && searched_league === '' && searched_manager === '') {
                        setStateTrades({
                            ...stateTrades,
                            count: trades.data.count,
                            [Math.ceil(page / 10)]: trade_finds
                        })
                    } else {
                        const searches = stateTrades.searches || []
                        setStateTrades({
                            ...stateTrades,
                            searches: [...searches, {
                                player: searched_player.id,
                                league: searched_league.id,
                                manager: searched_manager.id,
                                results: trade_finds
                            }]
                        })
                    }
                } else {
                    setStateTrades({ ...stateTrades })
                }
            } else if (filter === 'Trades with Leads') {
                if (!stateTradesTips[Math.ceil(page / 10)] || (!(searched_player === '' && searched_league === '') && !stateTradesTips.searches?.find(s => s.player === searched_player.id && s.league === searched_league.id))) {
                    trades = await axios.post('/trade/find', {
                        leaguemate_ids: Object.keys(stateLeaguemateIds),
                        user_id: state_user.user_id,
                        offset: (page - 1) * 25,
                        limit: 250,
                        player: searched_player.id,
                        manager: searched_manager.id,
                        league: searched_league.id,
                        tips: 1
                    })

                    const trade_finds = getTradeTips(trades.data.rows, stateLeagues, stateLeaguemateIds, params.season)

                    if (searched_player === '' && searched_league === '') {
                        setStateTradesTips({
                            ...stateTradesTips,
                            count: trades.data.count,
                            [Math.ceil(page / 10)]: trade_finds
                        })
                    } else {
                        const searches = stateTradesTips.searches || []
                        setStateTradesTips({
                            ...stateTradesTips,
                            searches: [...searches, {
                                player: searched_player.id,
                                league: searched_league.id,
                                results: trade_finds
                            }]
                        })
                    }
                } else {
                    setStateTradesTips({ ...stateTradesTips })
                }


            }


            setIsLoading(false)
        }
        fetchTrades()
    }, [params.username, page, searched_player, searched_league, searched_manager, filter])


    useEffect(() => {

        const fetchPlayerTrades = async () => {

            let pcTrades = pricecheckTrades

            if (!pcTrades[pricecheckPlayer.id]) {
                setIsLoading(true)
                const player_trades = await axios.post('/trade/pricecheck', {
                    player_id: pricecheckPlayer.id
                })
                pcTrades[pricecheckPlayer.id] = player_trades.data
                setPricecheckTrades({ ...pcTrades })
                setIsLoading(false)
            }
        }
        if (pricecheckPlayer !== '') {
            fetchPlayerTrades()
        }

    }, [pricecheckPlayer])

    useEffect(() => {
        setPage(1)
    }, [searched_player, searched_league, searched_manager, filter])


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

    let tradesDisplay;

    switch (filter) {
        case 'All Trades':
            if (searched_player === '' && searched_league === '' && searched_manager === '') {
                tradesDisplay = stateTrades[Math.ceil(page / 10)]?.slice(((page - 1) % 10) * 25, (((page - 1) % 10) * 25) + 25) || []
            } else {
                tradesDisplay = stateTrades.searches?.find(s => s.player === searched_player.id && s.league === searched_league.id && s.manager === searched_manager.id)?.results?.slice(((page - 1) % 10) * 25, (((page - 1) % 10) * 25) + 25) || []
            }
            break;
        case 'Trades with Leads':
            if (searched_player === '' && searched_league === '' && searched_manager === '') {
                tradesDisplay = stateTradesTips[Math.ceil(page / 10)]?.slice(((page - 1) % 10) * 25, (((page - 1) % 10) * 25) + 25) || []
            } else {
                tradesDisplay = stateTradesTips.searches?.find(s => s.player === searched_player.id && s.league === searched_league.id && s.manager === searched_manager.id)?.results?.slice(((page - 1) % 10) * 25, (((page - 1) % 10) * 25) + 25) || []
            }
            break;
        case 'Price Check':
            tradesDisplay = pricecheckTrades[pricecheckPlayer.id]
                ?.filter(
                    trade => Object.keys(trade.adds || {}).includes(pricecheckPlayer2.id) || pricecheckPlayer2 === ''
                        || trade.draft_picks?.find(pick => (`${pick.season} ${pick.round}.${pick.order?.toLocaleString("en-US", { minimumIntegerDigits: 2 })}`) === pricecheckPlayer2.id)
                )?.slice(((page - 1) % 10) * 25, (((page - 1) % 10) * 25) + 25) || []
            break;
        default:
            break;
    }


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
            stateLeagues.map(league => league.rosters?.map(roster => roster.players)).flat(3)
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

    const picks_list = []

    Array.from(Array(3).keys()).map(season => {
        return Array.from(Array(5).keys()).map(round => {
            return Array.from(Array(12).keys()).map(order => {
                return picks_list.push({
                    id: `${season + parseInt(stateState.league_season)} ${round + 1}.${(order + 1).toLocaleString("en-US", { minimumIntegerDigits: 2 })}`,
                    text: `${season + parseInt(stateState.league_season)} ${round + 1}.${(order + 1).toLocaleString("en-US", { minimumIntegerDigits: 2 })}`,
                    image: {
                        src: null,
                        alt: 'pick headshot',
                        type: 'player'
                    }
                })
            })
        })
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
            pricecheckTrades[pricecheckPlayer.id]?.map(trade => trade.draft_picks?.map(pick => `${pick.season} ${pick.round}.${pick.order?.toLocaleString("en-US", { minimumIntegerDigits: 2 })}`)).flat(2)
        )
    )
        .map(pick => {
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
        .filter(x => x.text !== pricecheckPlayer.text)
    ]



    let managers_list = Object.keys(stateLeaguemateIds).map(user_id => {
        return {
            id: user_id,
            text: stateLeaguemateIds[user_id].username,
            image: {
                src: stateLeaguemateIds[user_id].avatar,
                alt: 'user avatar',
                type: 'user'
            }
        }
    })



    let leagues_list = {}

    tradesDisplay
        .map(trade => {
            if (filter !== 'Trades with Leads') {
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

    let tradeCount;

    if (filter === 'All Trades') {
        if (searched_league === '' && searched_manager === '' && searched_player === '') {
            tradeCount = stateTrades.count
        } else {
            tradeCount = stateTrades.searches?.find(s => s.player === searched_player.id && s.league === searched_league.id && s.manager === searched_manager.id)?.results?.length
        }
    } else if (filter === 'Trades with Leads') {
        if (searched_league === '' && searched_manager === '' && searched_player === '') {
            tradeCount = stateTradesTips.count
        } else {
            tradeCount = stateTradesTips.searches?.find(s => s.player === searched_player.id && s.league === searched_league.id && s.manager === searched_manager.id)?.results?.length || 0
        }
    } else if (filter === 'Price Check') {
        tradeCount = pricecheckTrades[pricecheckPlayer.id]
            ?.filter(
                trade => Object.keys(trade.adds || {}).includes(pricecheckPlayer2.id) || pricecheckPlayer2 === ''
                    || trade.draft_picks?.find(pick => (`${pick.season} ${pick.round}.${pick.order?.toLocaleString("en-US", { minimumIntegerDigits: 2 })}`) === pricecheckPlayer2.id)
            )?.length || 0
    }

    return <>
        <h2>
            {tradeCount?.toLocaleString("en-US")}
            {` ${params.season} Trades`}

        </h2>

        <select
            className='trades'
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
            disabled={isLoading}
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
                            tab={filter}
                        />
                }
                <Search
                    id={'By Player'}
                    sendSearched={(data) => filter === 'Price Check' ? setPricecheckPlayer(data) : setSearched_Player(data)}
                    placeholder={`Player`}
                    list={[...players_list, ...picks_list].flat()}
                    tab={filter}
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
                            tab={filter}
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

        <div className="page_numbers_wrapper" ref={pageRef}>
            <>
                {
                    (Math.ceil((tradeCount || 0) / 25) <= 1) ? null :
                        <ol className="page_numbers">
                            {Array.from(Array(Math.ceil(tradeCount / 25)).keys()).map(page_number =>
                                <li className={page === page_number + 1 ? 'active click' : 'click'} key={page_number + 1} onClick={() => setPage(page_number + 1)} >
                                    {page_number + 1}
                                </li>
                            )}
                        </ol>
                }
            </>
        </div>
        {
            isLoading ?
                <div className='loading_wrapper'>
                    {loadingIcon}
                </div>
                :
                <TableMain
                    id={'trades'}
                    type={'main'}
                    headers={trades_headers}
                    body={trades_body}
                    itemActive={itemActive}
                    setItemActive={setItemActive}
                />
        }
    </>
}

export default Trades;