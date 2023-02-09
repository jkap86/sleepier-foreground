'use strict'
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const cluster = require('cluster');

const app = express();

app.use(compression())
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build')));


const db = require("./app/models");
db.sequelize.sync()
    .then(() => {
        console.log("Synced db.");
    })
    .catch((err) => {
        console.log("Failed to sync db: " + err.message);
    })


require("./app/routes/sync.routes")(app);
require("./app/routes/home.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/league.routes")(app);
require("./app/routes/trade.routes")(app);
require("./app/routes/playoffs.routes")(app);

app.get('*', async (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});


