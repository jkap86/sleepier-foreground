import { useState } from "react";
import TradeTargets from "./tradeTargets";
import TradeRosters from "./tradeRosters";

const TradeInfo = ({
    trade,
    stateAllPlayers,
    stateState,
    state_user
}) => {
    const [tab, setTab] = useState('Leads');

    let display;

    switch (tab) {
        case 'Leads':
            display = (
                <TradeTargets
                    trade={trade}
                    stateAllPlayers={stateAllPlayers}
                    stateState={stateState}
                    state_user={state_user}
                />
            )
            break;
        case 'Rosters':
            display = (
                <TradeRosters
                    trade={trade}
                    stateAllPlayers={stateAllPlayers}
                />
            )
            break;
        default:
            break;
    }

    return <>
        <div className="secondary nav">
            <button
                className={tab === 'Leads' ? 'active click' : 'click'}
                onClick={() => setTab('Leads')}
            >
                Leads
            </button>
            <button
                className={tab === 'Rosters' ? 'active click' : 'click'}
                onClick={() => setTab('Rosters')}
            >
                Rosters
            </button>
        </div>
        {display}
    </>
}

export default TradeInfo;