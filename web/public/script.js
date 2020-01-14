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
    setTimeout(updateSettings, 100);
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
    _settingsDbType.value = type;
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
    $('#settings-server-browser').attr('checked', _settings.server.openBrowser);
}

// Get new settings
function getEnteredSettings() {
    return {
        dbType: _settingsDbType.val() || _settings.dbType,
        mysql: {
            host: $('#settings-database-sql-host').val() || _settings.mysql.host,
            user: $('#settings-database-sql-user').val() || _settings.mysql.user,
            password: $('#settings-database-sql-password').val() || _settings.mysql.password,
            dbName: $('#settings-database-sql-name').val() || _settings.mysql.dbName
        },
        mongo: {
            uri: $('#settings-database-mongo-uri').val() || _settings.mongo.uri,
            options: _settings.mongo.options,
            dbName: $('#settings-database-mongo-name').val() || _settings.mongo.dbName
        },
        cores: $('#settings-scan-cores').val() || _settings.cores,
        server: {
            port: $('#settings-server-port').val() || _settings.server.port,
            openBrowser: $('#settings-server-browser').attr('checked') || _settings.server.openBrowser
        }
    };
}

// Send new settings
$('#settings').on('submit', function () {
    console.log(getEnteredSettings());
    socket.emit('change-settings', getEnteredSettings());
    socket.once('settings-changed', args => {
        console.log(args);
        sendToast('Settings change', args === true ? 'Settings changed successfully' : 'Settings change error');
    });
});
