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

    const user = await axios.get(`http://api.sleeper.app/v1/user/${req.body.username}`)

    if (user.data?.user_id) {
        const data = await User.findOrCreate({
            where: {
                user_id: user.data.user_id
            },
            defaults: {
                username: user.data.display_name,
                avatar: user.data.avatar
            }
        })

        res.send(data)
    } else {
        res.send({ error: 'User not found' })
    }

}
