'use strict'
const db = require("../models");
const User = db.users;
const Op = db.Sequelize.Op;
const https = require('https');
const axios = require('axios').create({
    headers: {
        'content-type': 'application/json'
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true })
});


exports.create = async (req, res) => {
    console.log(`***SEARCHING FOR ${req.body.username}*** SEASON: ${req.body.season}`)
    const user = await axios.get(`http://api.sleeper.app/v1/user/${req.body.username}`)

    if (user.data?.user_id) {
        const data = await User.findOrCreate({
            where: {
                user_id: user.data.user_id
            },
            defaults: {
                username: user.data.display_name,
                avatar: user.data.avatar,
                updatedAt: new Date()
            }
        })

        res.send(data)
    } else {
        res.send({ error: 'User not found' })
    }

}

exports.leaguemates = async (req, res) => {
    const cutoff = new Date(new Date() - 24 * 60 * 60 * 1000)



    await User.bulkCreate(req.body.leaguemates, {
        updateOnDuplicate: ['username', 'avatar', 'updatedAt']
    })

    const used = process.memoryUsage()
    for (let key in used) {
        console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
    res.send(cutoff)
}