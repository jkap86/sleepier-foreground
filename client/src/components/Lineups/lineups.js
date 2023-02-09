import { useState } from "react";
import Lineup_Check from "./lineup_check";
import WeeklyRankings from "./weekly_rankings";

const Lineups = ({
    stateState,
    stateAllPlayers,
    state_user,
    stateMatchups,
    syncLeague,
    tab,
    setTab,
    week,
    setWeek
}) => {


    const display = tab === 'Lineup Check' ?
        <Lineup_Check
            stateState={stateState}
            stateAllPlayers={stateAllPlayers}
            state_user={state_user}
            stateMatchups={stateMatchups}
            setTab={setTab}
            week={week}
            setWeek={setWeek}
            syncLeague={syncLeague}
        />
        :
        <WeeklyRankings
            stateState={stateState}
            stateAllPlayers={stateAllPlayers}
            setTab={setTab}
            week={week}
            setWeek={setWeek}
        />


    return <>
        {display}
    </>
}

export default Lineups;