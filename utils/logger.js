const dateFormat = require('./date-format');
const fs = require('fs');
const { Writable } = require('stream');

module.exports = (core) => {

    const logFolder = './logs/';
    let logPath;

    if (!fs.existsSync(logFolder))
        fs.mkdirSync(logFolder);

    logPath = logFolder + dateFormat('log [datetime].log', true);

    const writeStream = fs.createWriteStream(logPath);
    const writeLogs = new Writable({
        write(chunk, encoding, callback) {
            const log = chunk.toString().trim();
            const date = dateFormat('[year]-[month]-[day] [hour]:[min]:[sec].[ms] INFO ');
            if (log.split(/\n/g).length > 0) {  // If multiples lines at once
                log.split(/\n/g).join(`\n${date}`);
            }
            console.log(log);   // Log the logs (lol)
            writeStream.write(  // Write the logs
                `${date + log}\n`,
                () => {
                    callback();
                });
        }
    });

    core.stdout.pipe(writeLogs);

};