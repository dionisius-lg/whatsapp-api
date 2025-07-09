const responseHelper = require('./../helpers/response');
const appClientsModel = require('./../models/app-clients');

/**
 * Get All Data
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.getData = async (req, res) => {
    const { query } = req;
    const result = await appClientsModel.getAll(query);

    if (result.data) {
        return responseHelper.sendSuccess(res, result);
    }

    return responseHelper.sendNotFoundData(res);
};

/**
 * Get Data By ID
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.getDataById = async (req, res) => {
    const { params: { id } } = req;
    const result = await appClientsModel.getDetail({ id });

    if (result.data) {
        return responseHelper.sendSuccess(res, result);
    }

    return responseHelper.sendNotFoundData(res);
};

/**
 * Create new data
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.insertData = async (req, res) => {
    const { body } = req;
    const result = await appClientsModel.insertData(body);

    if (result.data) {
        return responseHelper.sendSuccessCreated(res, result);
    }

    return responseHelper.sendBadRequest(res, 'Request is invalid');
};

/**
 * Create new data
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.updateData = async (req, res) => {
    const { body, params: { id } } = req;
    const result = await appClientsModel.updateData(body, { id });

    if (result.data) {
        return responseHelper.sendSuccessCreated(res, result);
    }

    return responseHelper.sendBadRequest(res, 'Request is invalid');
};
