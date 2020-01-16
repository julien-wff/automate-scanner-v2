// Modules
const Database = require('./databases/Database');
const getFlowList = require('./tasks/get-flow-list');
const { fork } = require('child_process');
const ms = require('ms');

// Config
const config = require('./config');


// Core
(async function () {

    // Selecting database type
    let Db;
    if (config.dbType === 'sql') {

        Db = new Database.Mysql();
        await Db.connect(config.mysql.host, config.mysql.user, config.mysql.password, config.mysql.dbName);

    } else if (config.dbType === 'mongo') {

        Db = new Database.Mongo();
        await Db.connect(config.mongo.uri, config.mongo.options, config.mongo.dbName);

    } else {
        throw new Error(`Unknown database type ${config.dbType}`);
    }

    // Configuring database
    await Db.setup();

    // Querying the flow list
    let flowList = await getFlowList();
    flowList = flowList.slice(0, 1000);
    let stats = {
        totalFlowsCount: flowList.length,
        remainingFlows: flowList.length,
        isProcessComplete: false,
        startTime: Date.now(),
        pendingSave: 0,
        activeQueries: 0,
        errors: 0
    };
    let displayClock;


    // Setup module
    const addInDB = fork('./tasks/save-db.js', [], { detached: true });
    await new Promise(resolve => {
        addInDB.on('message', message => {
            if (message.type === 'db-ready') {
                console.log('Saving DB ready');
                resolve();
            }
        });
    });
    addInDB.on('message', message => {
        if (message.type === 'done') {
            stats.pendingSave--;
            displayStatus();
        }

    });


    // Managing workers
    let workers = [];
    for (let i = 0; i < config.cores; i++) {
        // noinspection ES6MissingAwait
        manageWorker(i);
    }


    async function manageWorker(workerId) {

        let flowId;
        await spawnWorker();

        async function spawnWorker() {
            workers[workerId] = fork('./tasks/query-flow.js');
            console.log(`Starting worker #${workerId} with PID ${workers[workerId].pid}`);
            await new Promise(resolve => {  // Wait until the worker is ready
                workers[workerId].on('message', message => {
                    if (message.type === 'ready')
                        resolve();
                });
            });

            workers[workerId].on('exit', async code => {  // When an error occurs on the worker
                if (code !== 0) {
                    console.error(`Worker error on flow #${flowId}, exit code: ${code}`);
                    stats.errors++;
                    stats.activeQueries--;
                    workers[workerId].removeAllListeners('exit');
                    workers[workerId].removeAllListeners('message');
                    await spawnWorker();
                    workers[workerId].send({ flowId, action: 'start-request' });   // Resend the flow to query
                    stats.activeQueries++;
                }
            });

            workers[workerId].on('message', message => {
                if (message.status === 'complete' && message.data) {    // When the worker has finished to query the data
                    saveData(message.data); // Save the data to the DB
                    stats.remainingFlows--; // Decrease the remaning flows count
                    stats.activeQueries--;  // Indicates that a query is stopped
                    queryFlow();            // Start querying
                    displayStatus();        // Update the display
                }
            });

        }

        queryFlow();

        function queryFlow() {
            if (stats.remainingFlows <= 1) return;
            flowId = flowList.shift();    // get the next flow ID and remove it from the list
            workers[workerId].send({ flowId, action: 'start-request' });
            stats.activeQueries++;
        }

        function saveData(data) {
            stats.pendingSave++;
            addInDB.send({ type: 'save', data });
        }

    }


    // Workers displays
    function displayStatus() {
        // Compile the data
        if (!displayClock) displayClock = setInterval(displayStatus, 1000);
        let percentage = Math.round((stats.totalFlowsCount - stats.remainingFlows) / stats.totalFlowsCount * 100 * 1e2) / 1e2;
        let OPperSec = (stats.totalFlowsCount - stats.remainingFlows) / (Date.now() - stats.startTime) * 1000;
        let remainTime;
        try {   // ms can throw an error sometimes
            remainTime = ms(Math.round((1 / OPperSec) * stats.remainingFlows * 1000 * 10000) / 10000);
        } catch (e) {
            remainTime = '<unavailable>';
        }

        // Send the data
        process.send({
                type: 'progress',
                data: {
                    percentage,
                    text: [
                        `Flows stored: ${stats.totalFlowsCount - stats.remainingFlows}/${stats.totalFlowsCount}`,
                        `Progression: ${percentage} %`,
                        `Time elapsed: ${ms(Date.now() - stats.startTime)}`,
                        `Speed: ${Math.round(OPperSec * 1e1) / 1e1} flows / second`,
                        `Time remaining: ${remainTime}`,
                        `Pending DB saves: ${stats.pendingSave}`,
                        `Active queries: ${stats.activeQueries}`,
                        `Query errors: ${stats.errors}`
                    ]
                }
            }
        );

        if (stats.remainingFlows <= 0 && stats.pendingSave <= 0)
            processEnd();

    }

    process.on('message', message => {
        const { type } = message;
        if (type === 'stop') {
            processEnd();
        }
    });

    function processEnd() {
        clearTimeout(displayClock); // Stop the display
        for (let worker of workers) // Stop workers
            worker.disconnect();
        addInDB.send({ type: 'shutdown' }); // Stop the DB worker
        process.send({ type: 'end' });
        process.exit(0);
    }

})();
