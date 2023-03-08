import { utils, read } from 'xlsx';

export const importRankings = (e, stateAllPlayers, setUploadedRankings) => {
    if (e.target.files[0]) {
        const reader = new FileReader()
        reader.onload = (e) => {
            const data = e.target.result
            const workbook = read(data, { type: 'array' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            let json = utils.sheet_to_json(worksheet)
            let uploadedRankings = []
            const cols = Object.keys(json[0])
            const p = cols.find(x => ['player', 'name'].includes(x.trim().toLowerCase()))
            const r = cols.find(x => ['rank'].includes(x.trim().toLowerCase()))
            const pos = cols.find(x => ['pos', 'position'].includes(x.trim().toLowerCase()))

            if (!(p && r && pos)) {
                setUploadedRankings({ error: 'error - column not found' })
                return
            }
            let notMatched = []
            json.map(player => {
                const player_to_update = matchRankings(player[p].trim().toLowerCase().replace(/[^a-z]/g, ""), player[pos], stateAllPlayers)
                const rank = player[r]
                if (player_to_update.error) {
                    notMatched.push(player)
                } else {
                    return uploadedRankings.push({
                        player: player_to_update,
                        rank: rank
                    })
                }
            })

            if (uploadedRankings.error) {
                console.log(uploadedRankings.error)
            }



            setUploadedRankings({
                uploadedRankings: uploadedRankings,
                notMatched: notMatched
            })

        }
        reader.readAsArrayBuffer(e.target.files[0])
    } else {
        console.log('no file')
    }
}

const matchRankings = (player, position, stateAllPlayers) => {

    let start = 0
    let end = 3
    const players_to_search = Object.keys(stateAllPlayers).filter(p => stateAllPlayers[p]?.position === position)
    let matches = players_to_search
        .filter(player_id => player.includes(stateAllPlayers[player_id]?.search_full_name.slice(start, end)) || stateAllPlayers[player_id]?.search_full_name.includes(player.slice(start, end)));

    while (matches.length > 1 && end <= 50) {
        end += 1
        matches = players_to_search
            .filter(player_id => player.includes(stateAllPlayers[player_id]?.search_full_name.slice(start, end)) || stateAllPlayers[player_id]?.search_full_name.includes(player.slice(start, end)));
    }

    if (matches.length === 1) {
        return {
            id: matches[0],
            ...stateAllPlayers[matches[0]]
        }
    } else {
        return {
            error: {
                player: player,
                position: position,
                matches: matches

            }
        }
    }

}

export const filterLeagues = (leagues, filter1, filter2, leaguemates, playershares, matchups) => {

    let filteredLeagues;
    let filteredLeaguemates;
    let filteredPlayerShares;
    let filteredMatchups;
    switch (filter1) {
        case ('Redraft'):
            filteredLeagues = leagues.filter(x => x.type !== 2);
            filteredLeaguemates = leaguemates.map(lm => {
                return {
                    ...lm,
                    leagues: lm.leagues.filter(x => x.type !== 2)
                }
            })
            filteredPlayerShares = playershares.map(player => {
                return {
                    ...player,
                    leagues_owned: player.leagues_owned.filter(x => x.type !== 2),
                    leagues_taken: player.leagues_taken.filter(x => x.type !== 2),
                    leagues_available: player.leagues_available.filter(x => x.type !== 2)
                }
            })
            filteredMatchups = matchups.filter(x => x.league.type !== 2)
            break;
        case ('All'):
            filteredLeagues = leagues;
            filteredLeaguemates = leaguemates.map(lm => {
                return {
                    ...lm,
                    leagues: lm.leagues
                }
            })
            filteredPlayerShares = playershares.map(player => {
                return {
                    ...player,
                    leagues_owned: player.leagues_owned,
                    leagues_taken: player.leagues_taken,
                    leagues_available: player.leagues_available
                }
            })
            filteredMatchups = matchups
            break;
        case ('Dynasty'):
            filteredLeagues = leagues.filter(x => x.type === 2)
            filteredLeaguemates = leaguemates.map(lm => {
                return {
                    ...lm,
                    leagues: lm.leagues.filter(x => x.type === 2)
                }
            })
            filteredPlayerShares = playershares.map(player => {
                return {
                    ...player,
                    leagues_owned: player.leagues_owned.filter(x => x.type === 2),
                    leagues_taken: player.leagues_taken.filter(x => x.type === 2),
                    leagues_available: player.leagues_available.filter(x => x.type === 2)
                }
            })
            filteredMatchups = matchups.filter(x => x.league.type === 2)
            break;
        default:
            filteredLeagues = leagues;
            filteredLeaguemates = leaguemates.map(lm => {
                return {
                    ...lm,
                    leagues: lm.leagues
                }
            })
            filteredPlayerShares = playershares.map(player => {
                return {
                    ...player,
                    leagues_owned: player.leagues_owned,
                    leagues_taken: player.leagues_taken,
                    leagues_available: player.leagues_available
                }
            })
            filteredMatchups = matchups;
            break;
    }
    let filteredLeagues2 = filteredLeagues
    let filteredLeaguemates2 = filteredLeaguemates
    let filteredPlayerShares2 = filteredPlayerShares
    let filteredMatchups2 = filteredMatchups
    switch (filter2) {
        case ('Bestball'):
            filteredLeagues2 = filteredLeagues.filter(x => x.best_ball === 1);
            filteredLeaguemates2 = filteredLeaguemates.map(lm => {
                return {
                    ...lm,
                    leagues: lm.leagues.filter(x => x.best_ball === 1)
                }
            })
            filteredPlayerShares2 = filteredPlayerShares.map(player => {
                return {
                    ...player,
                    leagues_owned: player.leagues_owned.filter(x => x.best_ball === 1),
                    leagues_taken: player.leagues_taken.filter(x => x.best_ball === 1),
                    leagues_available: player.leagues_available.filter(x => x.best_ball === 1)
                }
            })
            filteredMatchups2 = filteredMatchups.filter(x => x.league.best_ball === 1)
            break;
        case ('All'):
            filteredLeagues2 = filteredLeagues;
            filteredLeaguemates2 = filteredLeaguemates.map(lm => {
                return {
                    ...lm,
                    leagues: lm.leagues
                }
            })
            filteredPlayerShares2 = filteredPlayerShares.map(player => {
                return {
                    ...player,
                    leagues_owned: player.leagues_owned,
                    leagues_taken: player.leagues_taken,
                    leagues_available: player.leagues_available
                }
            })
            filteredMatchups2 = filteredMatchups
            break;
        case ('Standard'):
            filteredLeagues2 = filteredLeagues.filter(x => x.best_ball !== 1);
            filteredLeaguemates2 = filteredLeaguemates.map(lm => {
                return {
                    ...lm,
                    leagues: lm.leagues.filter(x => x.best_ball !== 1)
                }
            })
            filteredPlayerShares2 = filteredPlayerShares.map(player => {
                return {
                    ...player,
                    leagues_owned: player.leagues_owned.filter(x => x.best_ball !== 1),
                    leagues_taken: player.leagues_taken.filter(x => x.best_ball !== 1),
                    leagues_available: player.leagues_available.filter(x => x.best_ball !== 1)
                }
            })
            filteredMatchups2 = filteredMatchups.filter(x => x.league.best_ball !== 1)
            break;
        default:
            filteredLeagues2 = filteredLeagues;
            filteredLeaguemates2 = filteredLeaguemates.map(lm => {
                return {
                    ...lm,
                    leagues: lm.leagues
                }
            })
            filteredPlayerShares2 = filteredPlayerShares.map(player => {
                return {
                    ...player,
                    leagues_owned: player.leagues_owned,
                    leagues_taken: player.leagues_taken,
                    leagues_available: player.leagues_available
                }
            })
            filteredMatchups2 = filteredMatchups
            break;
    }

    return {
        leagues: filteredLeagues2,
        leaguemates: filteredLeaguemates2,
        playershares: filteredPlayerShares2,
        matchups: filteredMatchups2
    }

}