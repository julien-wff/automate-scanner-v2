// Modules
const Database = require('./databases/Database');
const getFlowList = require('./get-flow-list');
const saveData = require('./save-data');
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
    flowList = flowList.slice(0, 300);
    let stats = {
        totalFlowsCount: flowList.length,
        remainingFlows: flowList.length,
        isProcessComplete: false,
        startTime: Date.now(),
    };


    // Managing workers
    for (let i = 0; i < config.cores; i++) {
        startWorker();
    }
    const dataSaver = new saveData(Db);


    // Workers core
    function startWorker(inputId) {

        if (stats.remainingFlows === 0 && !inputId) return processEnd();

        const flowId = inputId || flowList.shift();
        const child = fork('./query-flow.js');
        child.send({ flowId, action: 'start-request' });

        child.on('message', async message => {

            if (message.status === 'complete' && message.data) {    // When the worker has finished to query the data
                await dataSaver.save(message.data);
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

    }

    // Workers displays
    function displayStatus() {
        console.clear();
        console.log(`Flows stored: ${stats.totalFlowsCount - stats.remainingFlows}/${stats.totalFlowsCount}`);
        console.log(`Progression: ${Math.round((stats.totalFlowsCount - stats.remainingFlows) / stats.totalFlowsCount * 100 * 1e2) / 1e2} %`);
        console.log(`Time elapsed: ${ms(Date.now() - stats.startTime)}`);
        let OPperSec = (stats.totalFlowsCount - stats.remainingFlows) / (Date.now() - stats.startTime) * 1000;
        console.log(`Speed: ${Math.round(OPperSec * 1e2) / 1e2} flows / second`);
        console.log(`Time remaining: ${ms(Math.round((1 / OPperSec) * stats.remainingFlows * 1000 * 10000) / 10000)}`);
    }

    function processEnd() {
        if (stats.isProcessComplete) return;
        stats.isProcessComplete = true;
        console.log('\n\nProcess end !');
        process.exit(0);
    }

})();
