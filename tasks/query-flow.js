const request = require('request');
const utf8 = require('utf8');

process.send({ type: 'ready' });

process.on('message', async message => {

    if (message.action === 'start-request' && message.flowId) {   // Request all the flow data

        const { flowId } = message;

        let flowData = await makeRequest(flowId, true);
        /** @type ArrayBuffer */
        let flowB64Data = await makeRequest(`${flowId}/data?uncounted=true`, false);
        let flowReviews = await makeRequest(`${flowId}/reviews`, true);

        let data = {
            ...flowData,
            title: checkEncoding(flowData['title']),
            description: checkEncoding(flowData['description']),
            b64Data: Buffer.from(flowB64Data).toString('base64'),
            reviews: flowReviews
        };

        for (let i = 0; i < flowReviews.length; i++) {
            data['reviews'][i]['comment'] = checkEncoding(data['reviews'][i]['comment']);
        }

        process.send({
            status: 'complete',
            data
        });

    }

});


async function makeRequest(path, json) {
    const requestOptions = {
        method: 'get',
        json,
        encoding: 'utf8'
    };
    return new Promise(resolve => {
        request(`https://llamalab.com/automate/community/api/v1/flows/${path}`, requestOptions, (err, res, body) => {
            if (err) throw new Error(err);
            resolve(body);
        });
    });
}


function checkEncoding(string) {
    let res;
    try {
        if (string) {
            res = utf8.encode(string);
        }
    } catch {
    }
    return res;
}
