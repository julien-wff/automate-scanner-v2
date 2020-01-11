let _settings = {
    dbType: 'mysql'
};

// Manage settings section visibility
document.getElementById('toggle-settings').addEventListener('click', toggleSettings);
document.getElementById('settings-reset').addEventListener('click', toggleSettings);

function toggleSettings() {
    document.getElementById('settings').classList.toggle('collapse');
    document.querySelector('#toggle-settings i').classList.toggle('reverted');
}

// Manage the DB type selection
const _settingsDbType = document.getElementById('settings-database-type');
_settingsDbType.value = _settings.dbType;
_settingsDbType.parentElement.after(...generateDbSettings(_settings.dbType));
_settingsDbType.addEventListener('change', function () {
    document.querySelectorAll('.settings-database-specific').forEach(element => {
        element.remove();
    });
    const selection = this.options[this.selectedIndex].value;
    if (selection === 'mysql')
        this.parentElement.after(...generateDbSettings('mysql'));
    else if (selection === 'mongo')
        this.parentElement.after(...generateDbSettings('mongo'));
});

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
        `;
    else if (type === 'mongo')
        result = `
        <label class="d-block settings-database-specific">
            Uri: <input type="text" class="form-control" id="settings-database-uri" required>
        </label>
        `;
    // Convert the text to HTML childNodes
    const template = document.createElement('template');
    template.innerHTML = result.trim();
    return template.content.childNodes;
}
