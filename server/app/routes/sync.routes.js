'use strict'

module.exports = app => {
    const syncs = require("../controllers/sync.controller.js");

    syncs.boot(app)

    syncs.playoffs(app)
}