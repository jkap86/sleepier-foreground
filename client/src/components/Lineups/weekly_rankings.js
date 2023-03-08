import TableMain from '../Home/tableMain';
import { useState } from "react";
import { importRankings } from '../Functions/filterData';

const WeeklyRankings = ({ stateState, stateAllPlayers, setTab, uploadedRankings, setUploadedRankings }) => {
    const [itemActive, setItemActive] = useState('');
    const [page, setPage] = useState(1)
    const [searched, setSearched] = useState('')



    console.log({
        uploadedRankings: uploadedRankings
    })


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

    const weekly_rankings_body = (uploadedRankings?.uploadedRankings || [])
        ?.map(player => {

            return {
                id: player.player.id,
                search: {
                    text: stateAllPlayers[player.player.id].full_name,
                    image: {
                        src: player.player.id,
                        alt: 'player photo',
                        type: 'player'
                    }
                },
                list: [
                    {
                        text: stateAllPlayers[player.player.id]?.full_name,
                        colSpan: 3,
                        className: 'left',
                        image: {
                            src: player.player.id,
                            alt: stateAllPlayers[player.player.id]?.full_name,
                            type: 'player'
                        }
                    },
                    {
                        text: player.rank,
                        colSpan: 1
                    }
                ]
            }
        })


    return <>
        <h1>
            {
                Object.keys(stateAllPlayers)
                    .filter(player_id => stateAllPlayers[player_id]?.rank_ecr < 999).length
            }
        </h1>
        {caption}
        <label className='upload'>
            Upload
            <input
                type={'file'}
                onChange={(e) => importRankings(e, stateAllPlayers, setUploadedRankings)}
            />
        </label>
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

        />

    </>
}

export default WeeklyRankings;