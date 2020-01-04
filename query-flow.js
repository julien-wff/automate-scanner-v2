const request = require('request');


process.on('message', message => {
    if (message.flowId && message.db) {

        console.log(`Query ${message.flowId}`);

    }
});
