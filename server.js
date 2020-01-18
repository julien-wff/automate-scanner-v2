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
let _logs = '';

console.log(`Starting server with PID ${process.pid}`);

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/web/index.html'));
});

app.use('/public', express.static(path.join(__dirname, '/web/public/')));

io.on('connection', socket => { // Registering socket events
    socket.emit('init', { config: _config, status, logs: _logs });
    socket.on('change-settings', args => {
        changeSettings(args, socket)
            .then(() => {
                console.log('Settings changed');
            });
    });
    socket.on('start-scan', () => {
        startScan(socket);
    });
    socket.on('stop-scan', () => {
        cancelScan();
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


let _coreStopped = false;
let _core;

function startScan() {

    _core = fork('./app.js', [], { silent: true });
    console.log(`Starting scan with PID ${_core.pid}`);
    io.emit('start-scan');
    status = 'scanning';
    _logs = '';
    _coreStopped = false;

    _core.stdout.on('data', chunk => {
        _logs += chunk.toString();
        io.emit('logs', _logs);
    });

    _core.on('message', message => {
        const { type, data } = message;
        if (type === 'progress' && data) {
            io.emit('status', data);
        } else if (type === 'end') {
            _core.disconnect();
            scanEnd(0);
        }
    });

    _core.on('exit', code => {
        if (code !== 0) scanEnd(code);
    });

}

function cancelScan() {
    if (_core === undefined || _coreStopped) return;
    console.log('Cancelling scan...');
    _core.send({ type: 'stop' });
    _coreStopped = true;
}

function scanEnd(code = 0) {
    console.log(`Scan ended with exit code ${code}${_coreStopped ? ' (manually stopped)' : ''}`);
    _core = undefined;
    status = 'idle';
    io.emit('end', { code, stopped: _coreStopped });
}
