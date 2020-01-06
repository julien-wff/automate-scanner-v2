const request = require('request');
const numeral = require('numeral');

/**
 * Query the flow list and parse it
 * @returns {Promise<Array<number>>} The flow list
 */
module.exports = async () => {

    return new Promise(resolve => {

        let options = {
            method: 'GET',
            url: 'https://llamalab.com/automate/community/flows-sitemap-0.txt'
        };

        console.log('Querying the flow list...');

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            console.log(`Request done, ${numeral(body.length).format('0.0 b')} received. Parsing data...`);

            // Formatting content
            let flowList = body
                .split(/\n/)
                .filter(line => line.match(/^https:\/\/llamalab.com\/automate\/community\/flows\/[0-9]{1,6}$/))
                .map(line => parseInt(line.split('/')[6]))
                .reverse();

            console.log(`Data parsed, ${numeral(flowList.length).format('0,0').replace(',', ' ')} flows found.`);

            resolve(flowList);
        });

    });

};
