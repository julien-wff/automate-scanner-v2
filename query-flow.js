const request = require('request');


process.on('message', async message => {

    if (message.action === 'start-request' && message.flowId) {   // Request all the flow data

        const { flowId } = message;

        let flowData = await makeRequest(flowId, true);
        /** @type ArrayBuffer */
        let flowB64Data = await makeRequest(`${flowId}/data?uncounted=true`, false);
        let flowReviews = await makeRequest(`${flowId}/reviews`, true);

        process.send({
            status: 'complete',
            data: {
                ...flowData,
                b64Data: Buffer.from(flowB64Data).toString('base64'),
                reviews: flowReviews
            }
        });

    }

});


async function makeRequest(path, json) {
    const requestOptions = {
        method: 'get',
        json
    };
    return new Promise(resolve => {
        request(`https://llamalab.com/automate/community/api/v1/flows/${path}`, requestOptions, (err, res, body) => {
            if (err) throw new Error(err);
            resolve(body);
        });
    });
}
