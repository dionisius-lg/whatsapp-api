const axios = require('axios');
const logger = require('./logger');
const valueHelper = require('./value');

const { isEmpty, isJson } = valueHelper;

const send = async ({ clients = [], body = {} }) => {
    let result = { success: 0, error: 0 };

    if (clients.length > 0) {
        let promises = [];

        for (let i in clients) {
            let { webhook_url, webhook_auth } = clients[i];

            if (!isEmpty(webhook_url)) {
                let headers = { 'Content-Type': 'application/json' };
                
                if (!isEmpty(webhook_auth) && isJson(webhook_auth)) {
                    let auth = JSON.parse(webhook_auth);
                    headers = { ...headers, ...auth};
                }

                promises.push(axios.post(webhook_url, body, { headers }));
            }
        }

        if (promises.length > 0) {
            const responses = await Promise.allSettled(promises);

            responses.forEach((res) => {
                switch (res.status) {
                    case 'fulfilled':
                        let { value } = res;

                        logger.success({
                            from: 'webhook-api',
                            message: `Send to ${value?.config?.url} success!`,
                            result: {
                                request: value?.config?.data ? JSON.parse(value.config.data) : null,
                                response: value?.data || null
                            }
                        });

                        result.success += 1;
                        break;
                    default:
                        let { reason } = res;

                        logger.error({
                            from: 'webhook-api',
                            message: `Send to ${reason?.config?.url} error! ${reason?.message}`,
                            result: {
                                request: reason?.config?.data ? JSON.parse(reason.config.data) : null,
                                response: reason?.response?.data || null
                            }
                        });

                        result.error += 1;
                        break;
                }
            });
        }
    }

    return result;
};

module.exports = { send };
