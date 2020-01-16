// ---------- GLOBAL ----------

let _settings = {
    dbType: 'sql',
    mysql: {
        host: 'localhost',
        user: 'root',
        password: '',
        dbName: 'automate-scanner'
    },
    mongo: {
        uri: 'mongodb://localhost/',
        options: {},
        dbName: 'automate-scanner'
    },
    cores: 8,
    logging: true,
    server: {
        port: 8080,
        openBrowser: false
    }
};

const socket = io();
socket.on('settings', data => {
    _settings = data;
    updateSettings();
    sendToast('Settings changed', 'Settings are reloaded from the config');
});

function sendToast(header, message, delay = 5000) {
    $('.toast .toast-body').text(message);
    $('.toast .toast-header strong').text(header);
    $('.toast').toast('dispose').toast({ delay }).toast('show');
}

// ---------- MANAGE SETTINGS CHANGE ----------

// Manage settings section visibility
$('#toggle-settings').on('click', () => {
    $('#toggle-settings i').toggleClass('reverted');
});
$('#settings-reset').on('click', () => {
    setTimeout(updateSettings, 20);
    $('#toggle-settings').trigger('click');
});

// Manage the DB type selection
const _settingsDbType = $('#settings-database-type');
changeDbType(_settings.dbType); // Set the DB type according to the settings
_settingsDbType.on('change', () => {
    changeDbType();
});

function changeDbType(type) {
    type = type || _settingsDbType.val() || 'sql';
    _settingsDbType.val(type);
    $('.settings-database-specific').remove();
    _settingsDbType.parent().after(generateDbSettings(type));
}

function generateDbSettings(type) {
    let result;
    if (type === 'sql')
        result = $(`
        <label class="d-block settings-database-specific">
            Host: <input type="text" class="form-control" id="settings-database-sql-host" value="${_settings.mysql.host}" required>
        </label>
        <label class="d-block settings-database-specific">
            User: <input type="text" class="form-control" id="settings-database-sql-user" value="${_settings.mysql.user}">
        </label>
        <label class="d-block settings-database-specific">
            Password: <input type="text" class="form-control" id="settings-database-sql-password" value="${_settings.mysql.password}">
        </label>
        <label class="d-block settings-database-specific">
            Database name: <input type="text" class="form-control" id="settings-database-sql-name" value="${_settings.mysql.dbName}" required>
        </label>
        `);
    else if (type === 'mongo')
        result = $(`
        <label class="d-block settings-database-specific">
            Uri: <input type="text" class="form-control" id="settings-database-mongo-uri" value="${_settings.mongo.uri}" required>
        </label>
        <label class="d-block settings-database-specific">
            Database name: <input type="text" class="form-control" id="settings-database-mongo-name" value="${_settings.mongo.dbName}" required>
        </label>
        `);
    return result;
}

// Manage the other settings change
function updateSettings() {
    changeDbType(_settings.dbType);
    $('#settings-scan-cores').val(_settings.cores);
    $('#settings-server-port').val(_settings.server.port);
    $('#settings-server-browser').prop('checked', _settings.server.openBrowser);
    $('#settings-scan-logging').prop('checked', _settings.logging);
}

// Get new settings
function getEnteredSettings() {
    const dbSqlPassword = $('#settings-database-sql-password').val();
    const dbSqlUser = $('#settings-database-sql-user').val();
    const serverOpenBrowser = $('#settings-server-browser').prop('checked');
    const scanLogging = $('#settings-scan-logging').prop('checked');
    return {
        dbType: _settingsDbType.val() || _settings.dbType,
        mysql: {
            host: $('#settings-database-sql-host').val() || _settings.mysql.host,
            user: dbSqlUser === '' ? '' : dbSqlUser || _settings.mysql.user,
            password: dbSqlPassword === '' ? '' : dbSqlPassword || _settings.mysql.password,
            dbName: $('#settings-database-sql-name').val() || _settings.mysql.dbName
        },
        mongo: {
            uri: $('#settings-database-mongo-uri').val() || _settings.mongo.uri,
            options: _settings.mongo.options,
            dbName: $('#settings-database-mongo-name').val() || _settings.mongo.dbName
        },
        cores: $('#settings-scan-cores').val() || _settings.cores,
        logging: typeof scanLogging === 'boolean' ? scanLogging : _settings.logging,
        server: {
            port: $('#settings-server-port').val() || _settings.server.port,
            openBrowser: typeof serverOpenBrowser === 'boolean' ? serverOpenBrowser : _settings.server.openBrowser
        }
    };
}

// Send new settings
$('#settings').on('submit', function () {
    socket.emit('change-settings', getEnteredSettings());
    socket.once('settings-changed', args => {
        sendToast('Settings change', args === true ? 'Settings changed successfully' : 'Settings change error');
    });
});


// ---------- START SCAN ----------

let scanStarted = false;
let progressBar;

$('#start-scan-button').on('click', () => {
    socket.emit('start-scan');
    socket.once('scan-started', args => {
        console.log('Scan :', args);
        if (args === true)
            startScan();
    });
});

function startScan() {
    if (scanStarted) return;
    // Insert the HTML
    $('#main-container').html(`
<!-- Nav bar -->
<div class="row">
    <div class="progress col-10 align-self-center px-0">
        <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%" id="progress-bar"></div>
    </div>
    <div class="btn btn-outline-danger ml-auto" id="cancel-scan">Cancel</div>
</div>
<div class="row">
    <!-- Scan progress -->
    <div class="col-md-6 py-3">
        <span class="text-uppercase font-weight-bold d-block">Scan progress</span>
        <span class="d-block" id="scan-progress-area"></span>
    </div>
    <!-- Scan progress -->
    <div class="col-md-6 py-3">
        <span class="text-uppercase font-weight-bold d-block">Logs</span>
        <span class="d-block" id="logs-area"></span>
    </div>
</div>
    `);
    // Set the variables
    scanStarted = true;
    progressBar = $('#progress-bar');
    // Set the listeners
    $('#cancel-scan').on('click', () => {
        endScan(true);
    });
    socket.on('logs', args => {
        $('#logs-area').html(args.replace(/\n/g, '<br>'));
    });
    socket.on('status', args => {
        $('#scan-progress-area').html(args.text.join('<br>'));
        $('#progress-bar').css('width', `${args.percentage}%`);
    });
    socket.on('end', code => {
        sendToast('Scan stopped', `Scan ended with an exit code ${code}`);
        endScan(false, code !== 0);
    });
}

function endScan(stopped = false, error = false) {
    const cancelScanButton = $('#cancel-scan');
    progressBar
        .removeClass(['progress-bar-striped', 'prohgress-bar']);
    if (stopped) {
        socket.emit('stop-scan');
        progressBar
            .text('Scan cancelled')
            .addClass(['bg-warning']);
    }
    if (error) {
        progressBar
            .addClass(['bg-danger']);
    }
    if (!stopped && !error) {
        progressBar
            .addClass('bg-success');
        cancelScanButton
            .removeClass('btn-outline-danger')
            .addClass('btn-outline-success');
    }

    cancelScanButton
        .text('Back')
        .on('click', () => {
            window.location.reload();
        });
}
