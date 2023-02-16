import TableMain from "../Home/tableMain";


const TradeTargets = ({
    trade,
    stateAllPlayers
}) => {


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
                colSpan: 3
            },
            {
                text: 'Player',
                colSpan: 3
            },
            {
                text: 'League',
                colSpan: 3
            }

        ]
    ]

    const trade_acquisitions_body = trade.tips.acquire.length === 0 ? [{ id: 'NONE', list: [{ text: '-', colSpan: 9 }] }] : trade.tips.acquire.map(add => {

        return {
            id: `${add.manager.user_id}_${add.player_id}_${add.league.league_id}`,
            list: [
                {
                    text: add.manager.username,
                    colSpan: 3,
                    className: 'left',
                    image: {
                        src: add.manager.avatar,
                        alt: 'manager avatar',
                        type: 'user'
                    }
                },
                {
                    text: stateAllPlayers[add.player_id]?.full_name,
                    colSpan: 3,
                    className: 'left',
                    image: {
                        src: add.player_id,
                        alt: 'player headshot',
                        type: 'player'
                    }
                },
                {
                    text: add.league.name,
                    colSpan: 3,
                    className: 'left',
                    image: {
                        src: add.league.avatar,
                        alt: 'league avatar',
                        type: 'league'
                    }
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
                colSpan: 3
            },
            {
                text: 'Player',
                colSpan: 3
            },
            {
                text: 'League',
                colSpan: 3
            }

        ]
    ]

    const trade_flips_body = trade.tips.trade_away.length === 0 ? [{ id: 'NONE', list: [{ text: '-', colSpan: 9 }] }] : trade.tips.trade_away.map(add => {

        return {
            id: `${add.manager.user_id}_${add.player_id}_${add.league.league_id}`,
            list: [
                {
                    text: add.manager.username,
                    colSpan: 3,
                    className: 'left',
                    image: {
                        src: add.manager.avatar,
                        alt: 'manager avatar',
                        type: 'user'
                    }
                },
                {
                    text: stateAllPlayers[add.player_id]?.full_name,
                    colSpan: 3,
                    className: 'left',
                    image: {
                        src: add.player_id,
                        alt: 'player headshot',
                        type: 'player'
                    }
                },
                {
                    text: add.league.name,
                    colSpan: 3,
                    className: 'left end',
                    image: {
                        src: add.league.avatar,
                        alt: 'league avatar',
                        type: 'league'
                    }
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