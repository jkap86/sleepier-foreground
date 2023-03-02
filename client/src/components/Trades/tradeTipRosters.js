import TableMain from "../Home/tableMain";
import { useState } from "react";


const TradeTipRosters = ({

}) => {
    const [roster1, setRoster1] = useState('Lineup')
    const [roster2, setRoster2] = useState('Lineup')

    return <>
        <div className="secondary nav">
            <div>
                <button
                    className={roster1 === 'Lineup' ? 'active click' : 'click'}
                    onClick={() => setRoster1('Lineup')}
                >
                    Lineup
                </button>
                <button
                    className={roster1 === 'QBs' ? 'active click' : 'click'}
                    onClick={() => setRoster1('QBs')}
                >
                    QBs
                </button>
                <button
                    className={roster1 === 'RBs' ? 'active click' : 'click'}
                    onClick={() => setRoster1('RBs')}
                >
                    RBs
                </button>
                <button
                    className={roster1 === 'WRs' ? 'active click' : 'click'}
                    onClick={() => setRoster1('WRs')}
                >
                    WRs
                </button>
                <button
                    className={roster1 === 'TEs' ? 'active click' : 'click'}
                    onClick={() => setRoster1('TEs')}
                >
                    TEs
                </button>
            </div>
            <div>
                <button
                    className={roster2 === 'Lineup' ? 'active click' : 'click'}
                    onClick={() => setRoster2('Lineup')}
                >
                    Lineup
                </button>
                <button
                    className={roster2 === 'QBs' ? 'active click' : 'click'}
                    onClick={() => setRoster2('QBs')}
                >
                    QBs
                </button>
                <button
                    className={roster2 === 'RBs' ? 'active click' : 'click'}
                    onClick={() => setRoster2('RBs')}
                >
                    RBs
                </button>
                <button
                    className={roster2 === 'WRs' ? 'active click' : 'click'}
                    onClick={() => setRoster2('WRs')}
                >
                    WRs
                </button>
                <button
                    className={roster2 === 'TEs' ? 'active click' : 'click'}
                    onClick={() => setRoster2('TEs')}
                >
                    TEs
                </button>
            </div>
        </div>
        <TableMain
            type={'tertiary subs'}
            headers={[]}
            body={[]}
        />
        <TableMain
            type={'tertiary subs'}
            headers={[]}
            body={[]}
        />
    </>
}

export default TradeTipRosters;