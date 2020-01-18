const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const fs = require('fs');
const jsonBeaufity = require('json-beautify');
const { fork } = require('child_process');

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


let _core, _logs = '';

function startScan(socket) {

    _core = fork('./app.js', [], { silent: true });
    socket.emit('scan-started', true);

    _core.stdout.on('data', chunk => {
        _logs += chunk.toString();
        io.emit('logs', _logs);
    });

    _core.on('message', message => {
        const { type, data } = message;
        if (type === 'progress' && data) {
            io.emit('status', data);
        } else if (type === 'end') {
            scanEnd();
            _core.disconnect();
        }
    });

    _core.on('exit', code => {
        scanEnd(code);
    });

    socket.on('stop-scan', () => {
        _core.send({ type: 'stop' });
    });

}

function scanEnd(code = 0) {
    io.emit('end', code);
}
