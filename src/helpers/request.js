/**
 * remove invalid column from object
 * @param {object} object 
 * @param {array} keys 
 */
exports.filterColumn = (object = {}, keys = []) => {
    Object.keys(object).forEach((key) => {
        if (!keys.includes(key)) {
            delete object[key];
        }
    });
};

/**
 * remove invalid data from object
 * @param {object} object
 */
exports.filterData = (object = {}) => {
    Object.keys(object).forEach((key) => {
        if (object[key] === undefined || object[key] === false) {
            delete object[key];
        }

        if ((typeof object[key] === 'string' && (object[key]).trim() === '') && object[key] !== null) {
            object[key] = null;
        }
    });
};

/**
 * return new valid object value
 * @param {object} object
 * @param {array} params
 * @returns {object} options
 */
exports.filterParam = (object = {}, params = []) => {
    let options = {};

    params.forEach((param) => {
        if (object[param] !== undefined || object[param] !== '') {
            options[param] = object[param];
        }
    });

    return options;
};
