'use strict'
const axios = require('axios');

module.exports = (sequelize, Sequelize) => {

    const User = sequelize.define("user", {
        user_id: {
            type: Sequelize.STRING,
            allowNUll: false,
            primaryKey: true
        },
        username: {
            type: Sequelize.STRING
        },
        avatar: {
            type: Sequelize.STRING
        },
        ...Object.fromEntries(Array.from(Array(2023 - 2017).keys()).map(key => {
            return [`${key + 2018}_leagues`, { type: Sequelize.JSONB }]
        }))
    });

    return User;
};