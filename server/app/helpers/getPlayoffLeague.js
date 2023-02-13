'use strict'
const https = require('https');
const axios = require('axios').create({
    headers: {
        'content-type': 'application/json'
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
    timeout: 10000
});
const axiosRetry = require('axios-retry');

axiosRetry(axios, {
    retries: 3,
    retryCondition: (error) => {
        return error.code === 'ECONNABORTED' || error.code === 'ERR_BAD_REQUEST' ||
            axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
    },
    retryDelay: (retryCount) => {
        return retryCount * 3000
    },
    shouldResetTimeout: true
})


const getPlayoffLeague = async (league_id) => {
    const [league, rosters, users] = await Promise.all([
        await axios.get(`https://api.sleeper.app/v1/league/${league_id}`),
        await axios.get(`https://api.sleeper.app/v1/league/${league_id}/rosters`),
        await axios.get(`https://api.sleeper.app/v1/league/${league_id}/users`)
    ])

    return {
        league: league.data,
        rosters: rosters.data,
        users: users.data
    }
}

module.exports = {
    getPlayoffLeague: getPlayoffLeague
}