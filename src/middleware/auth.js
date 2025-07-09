const responseHelper = require('./../helpers/response');
const valueHelper = require('./../helpers/value');
const appClientsModel = require('./../models/app-clients-cc');

const { sendForbidden, sendUnauthorized } = responseHelper;
const { isEmpty } = valueHelper;

/**
 * Verify client's api key
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next method
 */
exports.authenticateKey = async (req, res, next) => {
    const { headers } = req;
    const authKey = headers?.['x-api-key'] || null;

    if (!isEmpty(authKey)) {
        const { data } = await appClientsModel.getDetail({
            app_key: authKey,
            is_active: 1,
            user_id: 'NOT NULL'
        });

        if (!isEmpty(data)) {
            req.decoded = data;

            return next();
        }

        return sendUnauthorized(res, 'API key not valid');
    }

    return sendForbidden(res);
};
