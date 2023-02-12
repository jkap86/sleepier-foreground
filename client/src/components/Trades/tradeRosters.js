import LeagueInfo from "../Leagues/leagueInfo";

const TradeRosters = ({
    trade,
    stateAllPlayers
}) => {

    return <>
        <LeagueInfo
            league={{
                ...trade.league,
                rosters: trade.rosters,
                settings: {
                    type: trade.league.type,
                    best_ball: trade.league.best_ball
                }
            }}
            stateAllPlayers={stateAllPlayers}
            scoring_settings={trade.league.scoring_settings}
        />
    </>
}

export default TradeRosters;