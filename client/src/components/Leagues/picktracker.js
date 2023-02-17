import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from 'axios';
import TableMain from '../Home/tableMain';


const PickTracker = ({ }) => {
    const params = useParams();
    const [kickers, setKickers] = useState([])

    useEffect(() => {

        const fetchKickers = async () => {
            const kickers = await axios.post('/league/draft', {
                league_id: params.league_id

            })
            setKickers(kickers.data)
        }

        fetchKickers()

    }, [params.league_id])

    const headers = [
        [
            {
                text: 'Pick',
                colSpan: 2
            },
            {
                text: 'Manager',
                colSpan: 4
            },
            {
                text: 'Kicker',
                colSpan: 4
            }
        ]
    ]

    const body = kickers
        ?.map(kicker => {
            return {
                id: kicker.player_id,
                list: [
                    {
                        text: kicker.pick,
                        colSpan: 2
                    },
                    {
                        text: kicker.picked_by,
                        colSpan: 4
                    },
                    {
                        text: kicker.player,
                        colSpan: 4
                    }
                ]
            }
        })


    return <>
        <Link to={'/'} className='home' target={'_blank'}>
            Home
        </Link>
        <br />
        <br />
        <br />
        <br />
        <br />
        <TableMain
            type={'main'}
            headers={headers}
            body={body}
        />
    </>
}

export default PickTracker;