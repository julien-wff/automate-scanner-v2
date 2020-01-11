let _settings = {
    dbType: 'mysql'
};

// Manage settings section visibility
document.getElementById('toggle-settings').addEventListener('click', toggleSettings);
document.getElementById('settings-reset').addEventListener('click', () => {
    toggleSettings();
    changeDbType(_settings.dbType);
});

function toggleSettings() {
    document.getElementById('settings').classList.toggle('collapse');
    document.querySelector('#toggle-settings i').classList.toggle('reverted');
}

// Manage the DB type selection
const _settingsDbType = document.getElementById('settings-database-type');
changeDbType(_settings.dbType); // Set the DB type according to the settings
_settingsDbType.addEventListener('change', () => {
    changeDbType();
});

function changeDbType(type) {
    type = type || _settingsDbType.options[_settingsDbType.selectedIndex].value || 'mysql';
    _settingsDbType.value = type;
    document.querySelectorAll('.settings-database-specific').forEach(element => {
        element.remove();
    });
    _settingsDbType.parentElement.after(...generateDbSettings(type));
}

function generateDbSettings(type) {
    let result;
    if (type === 'mysql')
        result = `
        <label class="d-block settings-database-specific">
            Host: <input type="text" class="form-control" id="settings-database-host" required>
        </label>
        <label class="d-block settings-database-specific">
            User: <input type="text" class="form-control" id="settings-database-user">
        </label>
        <label class="d-block settings-database-specific">
            Password: <input type="text" class="form-control" id="settings-database-password">
        </label>
        <label class="d-block settings-database-specific">
            Database name: <input type="text" class="form-control" id="settings-database-name" required>
        </label>
        `;
    else if (type === 'mongo')
        result = `
        <label class="d-block settings-database-specific">
            Uri: <input type="text" class="form-control" id="settings-database-uri" required>
        </label>
        <label class="d-block settings-database-specific">
            Database name: <input type="text" class="form-control" id="settings-database-name" required>
        </label>
        `;
    // Convert the text to HTML childNodes
    const template = document.createElement('template');
    template.innerHTML = result.trim();
    return template.content.childNodes;
}
