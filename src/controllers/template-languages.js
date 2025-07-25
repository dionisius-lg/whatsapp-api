const config = require('./../config');
const logger = require('./../helpers/logger');
const responseHelper = require('./../helpers/response');
const whatsappApi = require('./../helpers/whatsapp-api');

const { whatsapp: { bsp } } = config;

/**
 * Fetch Template Languages
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.fetchLanguages = async (req, res) => {
    try {
        if (bsp !== 'IVO') {
            throw new Error('This endpoint is not support for current config');
        }

        const api = await whatsappApi.get('template-languages');

        if (![200, 201].includes(api.status)) {
            let message = 'Invalid request';

            if (api?.data?.message) {
                message = typeof api.data.message === 'string' ? api.data.message : api.data.message?.details || 'Invalid request';
            }

            if (api?.data?.errors) {
                message = api.data.errors;
            }

            throw new Error(message, { cause: api?.data || null });
        }

        // logger.success({
        //     from: 'template-languages:fetchLanguages',
        //     message: 'Fetch template languages success',
        //     result: api?.data || null
        // });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'template-languages:fetchLanguages',
            message: `Fetch template languages error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Fetch template languages error!');
    }
};
