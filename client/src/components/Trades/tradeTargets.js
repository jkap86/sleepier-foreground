import TableMain from "../Home/tableMain";


const TradeTargets = ({
    trade,
    stateAllPlayers
}) => {

    console.log(trade)
    const trade_acquisitions_headers = [
        [
            {
                text: 'Potential Acquisitions',
                colSpan: 9
            }
        ],
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

    const trade_acquisitions_body = trade.tips.acquire.length === 0 ? [{ id: 'NONE', list: [{ text: '-', colSpan: 9 }] }] : trade.tips.acquire.map(add => {

        return {
            id: `${add.manager.user_id}_${add.player_id}_${add.league.league_id}`,
            list: [
                {
                    text: add.manager.username,
                    colSpan: 2
                },
                {
                    text: stateAllPlayers[add.player_id]?.full_name,
                    colSpan: 3
                },
                {
                    text: add.league.name,
                    colSpan: 4
                }
            ]
        }

    })

    const trade_flips_headers = [
        [
            {
                text: 'Potential Flips',
                colSpan: 9
            }
        ],
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

    const trade_flips_body = trade.tips.trade_away.length === 0 ? [{ id: 'NONE', list: [{ text: '-', colSpan: 9 }] }] : trade.tips.trade_away.map(add => {

        return {
            id: `${add.manager.user_id}_${add.player_id}_${add.league.league_id}`,
            list: [
                {
                    text: add.manager.username,
                    colSpan: 2
                },
                {
                    text: stateAllPlayers[add.player_id]?.full_name,
                    colSpan: 3
                },
                {
                    text: add.league.name,
                    colSpan: 4
                }
            ]
        }

    })

    return <>
        <TableMain
            type={'secondary'}
            headers={trade_acquisitions_headers}
            body={trade_acquisitions_body}
        />
        <TableMain
            type={'secondary'}
            headers={trade_flips_headers}
            body={trade_flips_body}
        />
    </>
}

export default TradeTargets;