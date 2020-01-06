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
    flowList = flowList.slice(0, 50);
    let stats = {
        totalFlowsCount: flowList.length,
        remainingFlows: flowList.length,
        isProcessComplete: false,
        startTime: Date.now(),
        pendingSave: 0
    };


    // Managing workers
    for (let i = 0; i < config.cores; i++) {
        startWorker();
    }


    // Workers core
    function startWorker(inputId) {

        if (stats.remainingFlows === 0 && !inputId) return processEnd();

        const flowId = inputId || flowList.shift();
        const child = fork('./tasks/query-flow.js');
        child.send({ flowId, action: 'start-request' });

        child.on('message', async message => {

            if (message.status === 'complete' && message.data) {    // When the worker has finished to query the data
                saveData(message.data);
                child.disconnect();
                stats.remainingFlows--;
                displayStatus();
                startWorker();
            }

        });
        child.on('exit', code => {  // When an error occurs on the worker
            if (code !== 0) {
                console.error(`Worker error, exit code: ${code}`);
                startWorker(flowId);
            }
        });

        function saveData(data) {
            stats.pendingSave++;
            const child = fork('./tasks/save-db.js', [], { detached: true });
            child.send({ type: 'save', data });
            child.on('message', message => {
                if (message.type === 'done')
                    stats.pendingSave--;
            });
        }

    }

    let displayClock;

    // Workers displays
    function displayStatus() {
        if (!displayClock) displayClock = setInterval(displayStatus, 500);
        let percentage = Math.round((stats.totalFlowsCount - stats.remainingFlows) / stats.totalFlowsCount * 100 * 1e2) / 1e2;
        let OPperSec = (stats.totalFlowsCount - stats.remainingFlows) / (Date.now() - stats.startTime) * 1000;
        console.clear();
        console.log(`${displayBar()}
Flows stored: ${stats.totalFlowsCount - stats.remainingFlows}/${stats.totalFlowsCount}
Progression: ${percentage} %
Time elapsed: ${ms(Date.now() - stats.startTime)}
Speed: ${Math.round(OPperSec * 1e1) / 1e1} flows / second
Time remaining: ${ms(Math.round((1 / OPperSec) * stats.remainingFlows * 1000 * 10000) / 10000)}
Pending DB saves: ${stats.pendingSave}
        `);

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
        if (stats.isProcessComplete) return;
        clearTimeout(displayClock);
        stats.isProcessComplete = true;
        console.log('\n\nProcess end !');
        process.exit(0);
    }

})();
