const mysql = require('mysql');
const MongoClient = require('mongodb').MongoClient;


module.exports.Mysql = class {


    constructor() {
        this.db = undefined;
        this.dbName = undefined;
    }


    /**
     * Establish the connection with the database.
     * @param host {string} The host URL
     * @param user {string} The database access username
     * @param password {string} The database access password
     * @param dbName {string} The database name
     * @returns {Promise<mysql<Connection>>} The database connection
     */
    async connect(host, user, password, dbName) {
        return new Promise(resolve => {
            const db = mysql.createConnection({
                host,
                user,
                password,
                database: dbName
            });
            db.connect(err => {
                if (err) throw err;
                console.log(`[Sql] Database ${dbName} connected!`);
                this.db = db;
                this.dbName = dbName;
                resolve(db);
            });
        });
    }


    /**
     * Setup the database : delete the old one and recreate the structure
     * @returns {Promise<void>}
     */
    async setup() {
        // Delete old tables
        await this.deleteTable('flows');
        await this.deleteTable('reviews');
        // Create new tables
        await this.createTable('flows');
        await this.createTable('reviews');
    }


    /**
     * Delete a table in the database if it exists
     * @param tableName The name of the table to delete
     * @returns {Promise<void>}
     */
    async deleteTable(tableName) {
        let res = await this.makeQuery(`SHOW TABLES LIKE '%${tableName}%'`);
        if (res.length > 0) {
            await this.makeQuery(`DROP TABLE \`${this.dbName}\`.\`${tableName}\``);
            console.log(`[Sql] Table ${tableName} deleted!`);
        }
    }


    /**
     * Instructions to create a table with its structure, defined in the sql-tables.json file
     * @param tableName {string} The name of the table to create
     * @returns {Promise<void>}
     */
    async createTable(tableName) {
        const createRequests = require('./sql-tables');
        await this.makeQuery(createRequests[tableName]);
        console.log(`[Sql] Table ${tableName} created!`);
    }


    /**
     * Make a SQL query to the db
     * @param sql {string} The sql syntax
     * @param params {Array<*>} The parameters
     * @returns {Promise<Array<*>>} The query result
     */
    async makeQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.query(sql, params, (err, res) => {
                if (err)
                    return reject(err);
                res = JSON.parse(JSON.stringify(res)); // Convert it to plain object
                resolve(res);
            });
        });
    }


};


module.exports.Mongo = class {


    /**
     * Establish the connection with the database
     * @param uri {string} The database URI
     * @param options {Object} The connection options
     * @param dbName {string} The database name
     * @returns {Promise<Db>} The database connection
     */
    async connect(uri, options, dbName) {
        const connection = await MongoClient.connect(uri, {
            ...options,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        const db = connection.db(dbName);
        this.db = db;
        console.log(`[Mongo] Database ${dbName} connected!`);
        return db;
    }


    /**
     * Setup the database : delete the old one
     * @returns {Promise<void>}
     */
    async setup() {

    }


};
