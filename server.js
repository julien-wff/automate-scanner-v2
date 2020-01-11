const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

const config = require('./config');

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/web/index.html'));
});

app.use('/public', express.static(path.join(__dirname, '/web/public/')));

io.on('connection', socket => {
    console.log(`New connection with ID ${socket.id}`);
    socket.emit('settings', config);
});

server.listen(config.server.port);

if (config.server.openBrowser)
    require('opn')(`http://localhost:${config.server.port}/`);
