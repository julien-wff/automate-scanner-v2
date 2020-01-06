const config = require('../config');
const Database = require('../databases/Database');


process.on('message', async message => {
    if (message.type === 'save' && message.data) {

        const dataToSave = message.data;

        let Db;
        if (config.dbType === 'sql') {

            Db = new Database.Mysql();
            await Db.connect(config.mysql.host, config.mysql.user, config.mysql.password, config.mysql.dbName);

        } else if (config.dbType === 'mongo') {

            Db = new Database.Mongo();
            await Db.connect(config.mongo.uri, config.mongo.options, config.mongo.dbName);

        }

        await Db.addData(dataToSave);

        process.send({ type: 'done' });
    }
});
