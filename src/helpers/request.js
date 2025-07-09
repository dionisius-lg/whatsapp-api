/**
 * Remove invalid column from object
 * @param  {Object} object - Raw data column
 * @param  {string[]} keys - Data column to be keep
 * @returns {Object} - Filtered data
 */
exports.filterColumn = (object = {}, keys = []) => {
    const allowedKeys = new Set(keys); // use new Set(['array value']) for faster lookup (O(1))

    return Object.fromEntries(Object.entries(object).filter(([key]) => allowedKeys.has(key)));
};

/**
 * Remove invalid data from object
 * @param  {Object} object - Raw data
 * @returns {Object} - Filtered data
 */
exports.filterData = (object = {}) => {
    return Object.entries(object).reduce((acc, [key, value]) => {
        if (value === undefined || value === false) {
            return acc;
        } // Skip invalid values
		
        // Convert empty strings (excluding null) to null
        acc[key] = typeof value === 'string' && value.trim() === '' ? null : value;

        return acc;
    }, {});
};

/**
 * Return new valid object value
 * @param  {Object} object
 * @param  {string[]} parameters
 * @returns {Object}
 */
exports.filterParam = (object = {}, parameters = []) => {
    let options = {};

    parameters.forEach(function (param) {
        if (object[param] !== undefined || object[param] !== '') {
            options[param] = object[param];
        }
    });

    return options;
};
