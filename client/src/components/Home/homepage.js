import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import sleeperLogo from '../../images/sleeper_icon.png';
import './css/homepage.css';


const Homepage = () => {
    const [username, setUsername] = useState('')
    const [season, setSeason] = useState(new Date().getFullYear())


    return <div id='homepage'>
        <img
            alt='sleeper_logo'
            className='home'
            src={sleeperLogo}
        />

        <div className='home_wrapper'>
            <strong className='home'>
                Sleepier
            </strong>
            <div className='user_input'>
                <input
                    className='home'
                    type="text"
                    placeholder="Username"
                    onChange={(e) => setUsername(e.target.value)}
                />
                <select
                    className='home click'
                    onChange={(e) => setSeason(e.target.value)}
                    value={season}
                >
                    {
                        Array.from(Array(new Date().getFullYear() - 2017).keys())
                            .sort((a, b) => b - a)
                            .map(s =>
                                <option
                                    key={s}
                                >
                                    {s + 2018}
                                </option>
                            )
                    }
                </select>
            </div>
            <Link to={(username === '' || season === '') ? '/' : `/${username}/${season}`}>
                <button
                    className='home click'
                >
                    Submit
                </button>
            </Link>
        </div>
    </div>
}

export default Homepage;