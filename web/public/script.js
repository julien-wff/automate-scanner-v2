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
    //TODO: Send a toast when the settings are updated
});

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
            Host: <input type="text" class="form-control" id="settings-database-host" value="${_settings.mysql.host}" required>
        </label>
        <label class="d-block settings-database-specific">
            User: <input type="text" class="form-control" id="settings-database-user" value="${_settings.mysql.user}">
        </label>
        <label class="d-block settings-database-specific">
            Password: <input type="text" class="form-control" id="settings-database-password" value="${_settings.mysql.password}">
        </label>
        <label class="d-block settings-database-specific">
            Database name: <input type="text" class="form-control" id="settings-database-name" value="${_settings.mysql.dbName}" required>
        </label>
        `);
    else if (type === 'mongo')
        result = $(`
        <label class="d-block settings-database-specific">
            Uri: <input type="text" class="form-control" id="settings-database-uri" value="${_settings.mongo.uri}" required>
        </label>
        <label class="d-block settings-database-specific">
            Database name: <input type="text" class="form-control" id="settings-database-name" value="${_settings.mongo.dbName}" required>
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
