const express = require('express');
const opn = require('opn');
const path = require('path');

const app = express();
const config = require('./config');

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/web/index.html'));
});

app.use('/public', express.static(path.join(__dirname, '/web/public/')));

app.listen(config.server.port);

// opn(`http://localhost:${config.server.port}/`);