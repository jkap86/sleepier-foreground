import { useState } from "react";
import TableMain from "../Home/tableMain";


const PlayoffsBreakdown = ({
    total_optimal,
    stateWeek,
    allplayers,
    players_left,
    players_eliminated,
    schedule
}) => {
    const [playerActive, setPlayerActive] = useState('')


    const secondary_headers = [
        [
            {
                text: 'Pos',
                colSpan: 1
            },
            {
                text: 'Player',
                colSpan: 4
            },
            {
                text: 'Points',
                colSpan: 2
            }
        ]
    ]

    const secondary_body = Object.keys(total_optimal)
        .sort(
            (a, b) => stateWeek.length === 1 ?
                (total_optimal[a].index - total_optimal[b].index)
                : total_optimal[b].points - total_optimal[a].points

        )
        .map(player_id => {
            const className = players_eliminated.includes(player_id) || !players_left.includes(player_id) ? 'red' : ''
            return {
                id: player_id,
                list: [[
                    {
                        text: stateWeek.length === 1 ? total_optimal[player_id].slot : allplayers[player_id]?.position,
                        colSpan: 1,
                        className: className
                    },
                    {
                        text: allplayers[player_id] && (allplayers[player_id]?.full_name + ' ' + allplayers[player_id]?.team || 'FA') || '-',
                        colSpan: 4,
                        className: className
                    },
                    {
                        text: total_optimal[player_id].points.toFixed(2) || '0',
                        colSpan: 2,
                        className: className
                    }
                ]]
            }
        })

    const secondary_nav = (
        <div className="secondary nav">
            <div>
                <p className="green">
                    Active: {
                        Object.keys(total_optimal)
                            .filter(x => !players_eliminated.includes(x))
                            .reduce((acc, cur) => acc + total_optimal[cur].points, 0)
                            .toFixed(2)
                    }
                </p>
            </div>
            <div>
                <p className="red">
                    Eliminated: {

                        Object.keys(total_optimal)
                            .filter(x => players_eliminated.includes(x))
                            .reduce((acc, cur) => acc + total_optimal[cur].points, 0)
                            .toFixed(2)

                    }
                </p>
            </div>
        </div>
    )

    return <>
        {secondary_nav}
        <TableMain
            type={'secondary'}
            headers={secondary_headers}
            body={secondary_body}
            itemActive={playerActive}
            setItemActive={setPlayerActive}
        />
    </>
}

export default PlayoffsBreakdown;