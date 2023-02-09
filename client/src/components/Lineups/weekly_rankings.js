import TableMain from '../Home/tableMain';
import { useState } from "react";
import { importRankings } from '../Functions/filterData';

const WeeklyRankings = ({ stateState, stateAllPlayers, setTab }) => {
    const [itemActive, setItemActive] = useState('');
    const [page, setPage] = useState(1)
    const [searched, setSearched] = useState('')
    const [uploadedRankings, setUploadedRankings] = useState(null)

    /*
    console.log({
        uploadedRankings: uploadedRankings
    })
    */

    const caption = (
        <div className="primary nav">
            <select
                onChange={(e) => setTab(e.target.value)}
                className={'click'}
            >
                <option>Rankings</option>
                <option>Lineup Check</option>
            </select>
            <i className="fa-regular fa-rectangle-list"></i>
        </div>
    )

    const weekly_rankings_headers = [
        [
            {
                text: 'Player',
                colSpan: 3
            },
            {
                text: 'Opp',
                colSpan: 1
            },
            {
                text: 'Kickoff',
                colSpan: 1
            },
            {
                text: 'Rank',
                colSpan: 1
            }

        ]
    ]

    const weekly_rankings_body = Object.keys(stateAllPlayers)
        .filter(player_id => stateAllPlayers[player_id]?.rank_ecr < 999)
        .sort((a, b) => stateAllPlayers[a]?.rank_ecr - stateAllPlayers[b]?.rank_ecr)
        .map(player_id => {
            const kickoff = new Date(parseInt(stateAllPlayers[player_id]?.gametime) * 1000)
            return {
                id: player_id,
                search: {
                    text: stateAllPlayers[player_id].full_name,
                    image: {
                        src: player_id,
                        alt: 'player photo',
                        type: 'player'
                    }
                },
                list: [
                    {
                        text: stateAllPlayers[player_id]?.full_name,
                        colSpan: 3,
                        className: 'left',
                        image: {
                            src: player_id,
                            alt: stateAllPlayers[player_id]?.full_name,
                            type: 'player'
                        }
                    },
                    {
                        text: stateAllPlayers[player_id]?.player_opponent,
                        colSpan: 1
                    },
                    {
                        text: kickoff.toLocaleString("en-US", { weekday: 'short', hour: 'numeric' }),
                        colSpan: 1
                    },
                    {
                        text: stateAllPlayers[player_id]?.rank_ecr,
                        colSpan: 1
                    }
                ]
            }
        })

    const options = [
        <input
            type={'file'}
            onChange={(e) => importRankings(e, stateAllPlayers, setUploadedRankings)}
        />
    ]

    return <>
        {caption}
        <TableMain
            id={'Rankings'}
            type={'main'}
            headers={weekly_rankings_headers}
            body={weekly_rankings_body}
            page={page}
            setPage={setPage}
            itemActive={itemActive}
            setItemActive={setItemActive}
            search={true}
            searched={searched}
            setSearched={setSearched}
        //  options={options}
        />
    </>
}

export default WeeklyRankings;