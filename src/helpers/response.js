/**
 * Success 200 OK
 * @param {Response} res
 * @param {Result} result
 * @returns {Object} JSON object
 */
exports.sendSuccess = (res, result) => {
    if (typeof result === 'object' && Object.keys(result).length > 0) {
        const { total_data, data, limit, page } = result;

        if (total_data !== undefined && data !== undefined && limit !== undefined && page !== undefined) {
            if (Array.isArray(data) && Number(total_data) > 0 && Number(limit) > 0) {
                const current = parseInt(page, 10) || 1;
                const first = 1;
                const last = Math.ceil(Number(total_data || 1) / Number(limit || 1));
                const previous = (current - 1) > 0 ? (current - 1) : 1;
                const next = (current + 1) <= last ? (current + 1) : last;

                result.paging = { current, previous, next, first, last };
            }

            delete result.page;
            delete result.limit;
        }
    }

    return res.status(200).send(result);
};

/**
 * Success 201 Created
 * @param {Response} res
 * @param {Result} result
 * @returns {Object} JSON object
 */
exports.sendSuccessCreated = (res, result) => {
    return res.status(201).send(result);
};

/**
 * Error 400 Bad Request
 * @param {Response} res
 * @param {string} message
 * @returns {Object} JSON object
 */
exports.sendBadRequest = (res, message = '') => {
    let error = message || 'Request is invalid';

    return res.status(400).send({ error });
};

/**
 * Error 401 Unauthorized
 * @param {Response} res
 * @param {string} message
 * @returns {Object} JSON object
 */
exports.sendUnauthorized = (res, message = '') => {
    let error = message || 'You do not have rights to access this resource';

    return res.status(401).send({ error });
};

/**
 * Error 403 Forbidden
 * @param {Response} res
 * @returns {Object} JSON object
 */
exports.sendForbidden = (res) => {
    let error = 'You do not have rights to access this resource';

    return res.status(403).send({ error });
};

/**
 * Error 404 Resource Not Found
 * @param {Response} res
 * @returns {Object} JSON object
 */
exports.sendNotFound = (res) => {
    let error = 'Resource not found';

    return res.status(404).send({ error });
};

/**
 * Error 404 Data Not Found
 * @param {Response} res
 * @param {Object} data
 * @returns {Object} JSON object
 */
exports.sendNotFoundData = (res, message = '') => {
    let error = message || 'Data not found';

    return res.status(404).send({ error });
};

/**
 * Error 405 Method not allowed
 * @param {Response} res
 * @param {string} message
 * @returns {Object} JSON object
 */
exports.sendMethodNotAllowed = (res) => {
    let error = 'This resource is not match with your request method';

    return res.status(405).send({ error });
};

/**
 * Error 429 Too Many Request
 * @param {Response} res
 * @param {string} message
 * @returns {Object} JSON object
 */
exports.sendTooManyRequests = (res, message = '') => {
    let error = message || 'Too Many Requests';

    return res.status(429).send({ error });
};

/**
 * Error 500 Internal Server Error
 * @param {Response} res
 * @returns {Object} JSON object
 */
exports.sendInternalServerError = (res) => {
    let error = 'The server encountered an error, please try again later';

    return res.status(500).send({ error });
};
