const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const fs = require('fs');

let config = require('./config');

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/web/index.html'));
});

app.use('/public', express.static(path.join(__dirname, '/web/public/')));

io.on('connection', socket => {
    socket.emit('settings', config);
    socket.on('change-settings', args => {
        changeSettings(args, socket)
            .then(() => {
                console.log('Settings changed');
            });
    });
});

server.listen(config.server.port);

if (config.server.openBrowser)
    require('opn')(`http://localhost:${config.server.port}/`);

async function changeSettings(newSettings, socket) {
    const oldConfig = fs.readFileSync('_config.js');
    // TODO: write the changes in the config file
    config = newSettings;
    socket.broadcast.emit('settings', config);
    socket.emit('settings-changed', true);
}
