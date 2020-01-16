module.exports = (inputString, dashMode, date) => {

    date = date || new Date();

    const dateValues = {
        year: String(date.getFullYear()),
        month: String(date.getMonth()).length === 1 ? '0' + date.getMonth() : String(date.getMonth()),
        day: String(date.getDate()).length === 1 ? '0' + date.getDate() : String(date.getDate()),
        hour: String(date.getHours()).length === 1 ? '0' + date.getHours() : String(date.getHours()),
        min: String(date.getMinutes()).length === 1 ? '0' + date.getMinutes() : String(date.getMinutes()),
        sec: String(date.getSeconds()).length === 1 ? '0' + date.getSeconds() : String(date.getSeconds()),
        ms: String(date.getMilliseconds()).length === 1
            ? '00' + date.getMilliseconds()
            : String(date.getMilliseconds()).length === 2
                ? '0' + date.getMilliseconds()
                : String(date.getMilliseconds())
    };

    inputString = inputString
        .replace(/\[datetime]/g, '[date]T[time]')
        .replace(/\[time]/g, '[hour] [min] [sec]')
        .replace(/\[date]/g, '[year] [day] [month]')
        .replace(/\[day]/g, dateValues.day)
        .replace(/\[month]/g, dateValues.month)
        .replace(/\[year]/g, dateValues.year)
        .replace(/\[hour]/g, dateValues.hour)
        .replace(/\[min]/g, dateValues.min)
        .replace(/\[sec]/g, dateValues.sec)
        .replace(/\[ms]/g, dateValues.ms);

    if (dashMode) {
        inputString = inputString.replace(/ /g, '-');
    }

    return inputString;

};
