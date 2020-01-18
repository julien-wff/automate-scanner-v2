const dateFormat = require('./date-format');
const fs = require('fs');
const { Writable, Transform } = require('stream');

module.exports = (core, logBack) => {

    const logFolder = './logs/';
    let logPath;

    if (!fs.existsSync(logFolder))
        fs.mkdirSync(logFolder);

    logPath = logFolder + dateFormat('log [datetime].log', true);

    const writeStream = fs.createWriteStream(logPath);
    const transformInfo = new Transform({
        transform(chunk, encoding, callback) {
            let log = chunk.toString().trim();
            if (logBack) console.log(log);   // Log the logs (lol)
            const prefix = dateFormat('[year]-[month]-[day] [hour]:[min]:[sec].[ms] INFO ');
            if (log.split(/\r?\n|\r/g).length > 0) {  // If multiples lines at once
                log = log.replace(/\r?\n|\r/g, `\n${prefix}`);
            }
            callback(null, `${prefix + log}\n`);
        }
    });
    const transformError = new Transform({
        transform(chunk, encoding, callback) {
            let log = chunk.toString().trim();
            if (logBack) console.error(log);   // Log the logs (lol)
            const prefix = dateFormat('[year]-[month]-[day] [hour]:[min]:[sec].[ms] ERROR ');
            if (log.split(/\r?\n|\r/g).length > 0) {  // If multiples lines at once
                log = log.replace(/\r?\n|\r/g, `\n${prefix}`);
            }
            callback(null, `${prefix + log}\n`);
        }
    });
    const writeLogs = new Writable({
        write(chunk, encoding, callback) {
            writeStream.write(  // Write the logs
                chunk,
                () => {
                    callback();
                });
        }
    });

    core.stdout.pipe(transformInfo).pipe(writeLogs);
    core.stderr.pipe(transformError).pipe(writeLogs);

};
