const Database = require('./databases/Database').Mysql;

module.exports = class {

    /**
     *
     * @param db {Database}
     */
    constructor(db) {
        this.Db = db;
    }

    async save(data) {
        await this.Db.addData(data);
    }

};
