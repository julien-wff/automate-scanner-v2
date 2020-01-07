const config = require('../config');
const Database = require('../databases/Database');

(async function () {

    let Db;
    if (config.dbType === 'sql') {

        Db = new Database.Mysql();
        await Db.connect(config.mysql.host, config.mysql.user, config.mysql.password, config.mysql.dbName);

    } else if (config.dbType === 'mongo') {

        Db = new Database.Mongo();
        await Db.connect(config.mongo.uri, config.mongo.options, config.mongo.dbName);

    }

    process.send({ type: 'db-ready' });

    process.on('message', async message => {
        if (message.type === 'save' && message.data) {
            await Db.addData(message.data);
            if (process.connected)
                process.send({ type: 'done' });
        } else if (message.type === 'shutdown') {
            await Db.disconnect();
            process.exit(0);
        }
    });

})();

