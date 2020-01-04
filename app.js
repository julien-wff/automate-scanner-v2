// Modules
const Database = require('./databases/Database');
const getFlowList = require('./get-flow-list');
const { fork } = require('child_process');

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
    flowList = flowList.slice(0, 100);
    let stats = {
        totalFlowsCount: flowList.length,
        isProcessComplete: false,
        startTime: Date.now()
    };


    // Managing workers
    for (let i = 0; i < config.cores; i++) {
        startWorker();
    }

    function startWorker(inputId) {

        if (flowList.length === 0 && !inputId) return processEnd();

        const flowId = inputId || flowList.shift();
        const child = fork('./query-flow.js');
        child.send({ flowId });

        child.on('message', message => {

            if (message.status === 'complete') {
                child.disconnect();
                startWorker();
                displayStatus();
            } else if (message.status === 'data' && message.data) {

            }

        });

        child.on('exit', code => {
            if (code !== 0) {
                console.error(`Worker error, exit code: ${code}`);
                startWorker(flowId);
            }
        });

    }

    function displayStatus() {
        console.clear();
        console.log(`${stats.totalFlowsCount - flowList.length}/${stats.totalFlowsCount}`);
    }

    function processEnd() {
        if (stats.isProcessComplete) return;
        stats.isProcessComplete = true;
        console.clear();
        console.log('process end !');
    }

    // process.exit(0);

})();
