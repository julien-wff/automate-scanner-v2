// Modules
const Database = require('./databases/Database');
const getFlowList = require('./tasks/get-flow-list');
const { fork } = require('child_process');
const ms = require('ms');

// Config
const config = require('./config');


// Core
(async function () {

    // Set window title
    if (process.platform === 'win32') {
        process.title = 'Automate scanner v2';
    } else {
        process.stdout.write('\x1b]2;Automate scanner v2\x1b\x5c');
    }

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
    flowList = flowList.slice(0, 100);
    let stats = {
        totalFlowsCount: flowList.length,
        remainingFlows: flowList.length,
        isProcessComplete: false,
        startTime: Date.now(),
        pendingSave: 0,
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
    for (let i = 0; i < config.cores; i++) {
        // startWorker();
        manageWorker(i);
    }


    async function manageWorker(workerId) {

        const worker = fork('./tasks/query-flow.js');
        await new Promise(resolve => {
            worker.on('message', message => {
                if (message.type === 'ready')
                    resolve();
            });
        });

        console.log(`Starting worker #${workerId}`);

        queryFlow();

        function queryFlow() {

            if (stats.remainingFlows <= 1) return;

            const flowId = flowList.shift();    // get the next flow ID and remove it from the list
            worker.send({ flowId, action: 'start-request' });

            worker.on('message', message => {

                if (message.status === 'complete' && message.data) {    // When the worker has finished to query the data
                    saveData(message.data); // Save the data to the DB
                    stats.remainingFlows--; // Decrease the remaning flows count
                    worker.removeAllListeners('message');   // Remove the listener
                    queryFlow();            // Start querying
                    displayStatus();        // Update the display
                }

            });
            worker.on('exit', code => {  // When an error occurs on the worker
                if (code !== 0) {
                    console.error(`Worker error, exit code: ${code}`);
                    worker.send({ flowId, action: 'start-request' });   // Resend the flow to query
                    stats.errors++;
                }
            });
        }

        function saveData(data) {
            stats.pendingSave++;
            addInDB.send({ type: 'save', data });
        }

    }


    // Workers displays
    function displayStatus() {
        if (!displayClock) displayClock = setInterval(displayStatus, 1000);
        let percentage = Math.round((stats.totalFlowsCount - stats.remainingFlows) / stats.totalFlowsCount * 100 * 1e2) / 1e2;
        let OPperSec = (stats.totalFlowsCount - stats.remainingFlows) / (Date.now() - stats.startTime) * 1000;
        let remainTime, progressBar;
        try {   // ms can throw an error sometimes
            remainTime = ms(Math.round((1 / OPperSec) * stats.remainingFlows * 1000 * 10000) / 10000);
        } catch (e) {
            remainTime = '<unavailable>';
        }
        try {   // ms can throw an error sometimes
            progressBar = displayBar();
        } catch (e) {
            progressBar = '';
        }
        console.clear();
        console.log(`${progressBar}
Flows stored: ${stats.totalFlowsCount - stats.remainingFlows}/${stats.totalFlowsCount}
Progression: ${percentage} %
Time elapsed: ${ms(Date.now() - stats.startTime)}
Speed: ${Math.round(OPperSec * 1e1) / 1e1} flows / second
Time remaining: ${remainTime}
Pending DB saves: ${stats.pendingSave}
Query errors: ${stats.errors}
        `);

        if (stats.remainingFlows <= 0 && stats.pendingSave <= 0)
            processEnd();

        function displayBar() {
            let wSize = process.stdout.columns - 2;
            let fullChars = Math.floor(wSize * percentage / 100);
            let display = '[';
            display += '#'.repeat(fullChars);
            display += '-'.repeat(wSize - fullChars);
            return display + ']';
        }

    }

    function processEnd() {
        clearTimeout(displayClock);
        addInDB.send({ type: 'shutdown' });
        console.log('\n\nProcess end !');
        process.exit(0);
    }

})();
