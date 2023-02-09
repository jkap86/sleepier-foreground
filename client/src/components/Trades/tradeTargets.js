import TableMain from "../Home/tableMain";


const TradeTargets = ({
    trade,
    stateAllPlayers
}) => {

    console.log(trade)
    const trade_targets_headers = [
        [
            {
                text: 'Manager',
                colSpan: 2
            },
            {
                text: 'Player',
                colSpan: 3
            },
            {
                text: 'League',
                colSpan: 4
            }

        ]
    ]

    const trade_owned_body = [
        {
            id: 'Acquire',
            list: [[
                {
                    text: trade.tips.acquire.length > 0 ? 'Potential Acquisitions' : 'No Potential Acquisitions',
                    colSpan: 9
                }
            ]]
        },
        ...trade.tips.acquire.map(add => {

            return {
                id: `${add.manager.user_id}_${add.player_id}_${add.league.league_id}`,
                list: [[
                    {
                        text: add.manager.username,
                        colSpan: 2
                    },
                    {
                        text: '- ' + stateAllPlayers[add.player_id]?.full_name,
                        colSpan: 3
                    },
                    {
                        text: add.league.name,
                        colSpan: 4
                    }
                ]]
            }

        }),
        {
            id: 'Trade Away',
            list: [[
                {
                    text: trade.tips.trade_away.length > 0 ? 'Potential Flips' : 'No Potential Flips',
                    colSpan: 9
                }
            ]]
        },
        ...trade.tips.trade_away.map(drop => {

            return {
                id: `${drop.manager.user_id}_${drop.player_id}_${drop.league.league_id}`,
                list: [[
                    {
                        text: drop.manager.username,
                        colSpan: 2
                    },
                    {
                        text: '- ' + stateAllPlayers[drop.player_id]?.full_name,
                        colSpan: 3
                    },
                    {
                        text: drop.league.name,
                        colSpan: 4
                    }
                ]]
            }

        })
    ]


    /*
        const trade_unowned_body = trade.managers.map(manager => {
            return Object.keys(stateTradePlayers.unowned[manager.user_id] || {})
                .filter(player_id => trade.drops && trade.drops[player_id] === manager.user_id)
                .map(player_id => {
                    return stateTradePlayers.unowned[manager.user_id][player_id]
                        .filter(league => league !== trade.league.name)
                        .map(league => {
                            return {
                                id: `${manager.user_id}_${player_id}_${league}`,
                                list: [[
                                    {
                                        text: manager.username,
                                        colSpan: 2
                                    },
                                    {
                                        text: '+ ' + stateAllPlayers[player_id]?.full_name,
                                        colSpan: 3
                                    },
                                    {
                                        text: league,
                                        colSpan: 4
                                    }
                                ]]
                            }
                        })
                })
        }).flat(2)
    */
    return <>
        <TableMain
            type={'secondary'}
            headers={trade_targets_headers}
            body={trade_owned_body}
        />
    </>
}

export default TradeTargets;