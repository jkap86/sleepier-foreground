'use strict'
const db = require("../models");
const User = db.users;
const Op = db.Sequelize.Op;

exports.home = async (req, res, app) => {
    const state = app.get('state')
    const allplayers = app.get('allplayers')



    res.send({
        state: state,
        allplayers: allplayers
    })
}

exports.users = async (req, res) => {
    const recent_users = await User.findAll({
        order: [['updatedAt', 'DESC']],
        limit: 100
    })

    res.send(recent_users.sort((a, b) => b.updatedAt - a.updatedAt))
}