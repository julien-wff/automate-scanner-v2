const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const fs = require('fs');
const jsonBeaufity = require('json-beautify');

let _config = require('./config');
let status = 'idle';

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/web/index.html'));
});

app.use('/public', express.static(path.join(__dirname, '/web/public/')));

io.on('connection', socket => { // Registering socket events
    socket.emit('init', { config: _config, status });
    socket.on('change-settings', args => {
        changeSettings(args, socket)
            .then(() => {
                console.log('Settings changed');
            });
    });
    socket.on('start-scan', () => {
        startScan(socket);
    });
});

server.listen(_config.server.port);

if (_config.server.openBrowser)
    require('better-opn')(`http://localhost:${_config.server.port}/`);


// ----------- SOCKET FUNCTIONS ----------

async function changeSettings(newSettings, socket) {
    _config = {
        ..._config,
        ...newSettings
    };
    fs.writeFileSync('config.json', jsonBeaufity(_config, null, 2, 20));
    socket.broadcast.emit('settings', _config);
    socket.emit('settings-changed', true);
}


function startScan(socket) {
    socket.emit('scan-started', true);
}
