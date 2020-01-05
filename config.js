// Configuration file

module.exports = {
    // Database type: sql or mongo
    dbType: 'sql',

    // Mysql DB config
    mysql: {
        host: 'localhost',
        user: 'root',
        password: '',
        dbName: 'automate-scanner'
    },

    // MongoDB config
    mongo: {
        uri: 'mongodb://localhost/',
        options: {},
        dbName: 'automate-scanner'
    },

    // Simultaneous flow requests
    cores: 8,
};
