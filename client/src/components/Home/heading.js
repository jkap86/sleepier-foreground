import { avatar } from '../Functions/misc';
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from 'react-router-dom';
import './css/heading.css';

const Heading = ({
    stateState,
    state_user,
    stateLeaguesFiltered,
    tab,
    setTab,
    type1,
    setType1,
    type2,
    setType2
}) => {
    const params = useParams();
    const navigate = useNavigate();


    return <>
        <div className="heading">
            <select
                className="view click"
                defaultValue={params.season}
                onChange={(e) => navigate(`/${params.username}/${e.target.value}`)}
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
            <h1>
                <p className="image">
                    {
                        state_user.avatar && avatar(state_user.avatar, state_user.display_name, 'user')
                    }
                    <strong>
                        {state_user.username}
                    </strong>
                </p>
            </h1>
            <div className="navbar">
                <select
                    className="nav active click"
                    value={tab}
                    onChange={(e) => setTab(e.target.value)}
                >
                    <option>Trades</option>
                    <option>Lineups</option>
                    <option>Players</option>
                    <option>Leagues</option>
                    <option>Leaguemates</option>
                </select>

            </div>
            <div className="switch_wrapper">
                <div className="switch">
                    <button className={type1 === 'Redraft' ? 'sw active click' : 'sw click'} onClick={() => setType1('Redraft')}>Redraft</button>
                    <button className={type1 === 'All' ? 'sw active click' : 'sw click'} onClick={() => setType1('All')}>All</button>
                    <button className={type1 === 'Dynasty' ? 'sw active click' : 'sw click'} onClick={() => setType1('Dynasty')}>Dynasty</button>
                </div>
                <div className="switch">
                    <button className={type2 === 'Bestball' ? 'sw active click' : 'sw click'} onClick={() => setType2('Bestball')}>Bestball</button>
                    <button className={type2 === 'All' ? 'sw active click' : 'sw click'} onClick={() => setType2('All')}>All</button>
                    <button className={type2 === 'Standard' ? 'sw active click' : 'sw click'} onClick={() => setType2('Standard')}>Standard</button>
                </div>
            </div>
            <h2>
                {tab === 'Trades' ? null : `${stateLeaguesFiltered.length} Leagues`}
            </h2>
        </div>
    </>
}

export default Heading;