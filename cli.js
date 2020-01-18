const { fork } = require('child_process');

const config = require('./config');

// Set window title
if (process.platform === 'win32') {
    process.title = 'Automate scanner v2';
} else {
    process.stdout.write('\x1b]2;Automate scanner v2\x1b\x5c');
}

// Start core app (silent if logging)
const core = fork('app.js', [], { silent: config.logging });

// Logging system
if (config.logging) {
    require('./utils/logger')(core, true);
}

// On core message
core.on('message', message => {

    const { type, data } = message;

    if (type === 'progress' && data) {

        console.clear();
        console.log(displayBar(data.percentage));
        console.log(data.text.join('\n'));

    } else if (type === 'end') {

        core.disconnect();
        console.log('\n\nProcess complete!');
        process.exit(0);

    }

});

// On core error
core.on('exit', code => {
    if (code !== 0) {
        console.error(`Application exited with code ${code}`);
        process.exit(code);
    }
});

// Generate the progress bar depending on the terminal size
function displayBar(percentage) {
    try {
        let wSize = process.stdout.columns - 2;
        let fullChars = Math.floor(wSize * percentage / 100);
        let display = '[';
        display += '#'.repeat(fullChars);
        display += '-'.repeat(wSize - fullChars);
        return display + ']';
    } catch (e) {
        return null;
    }
}
