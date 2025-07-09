const dbQueryHelper = require('./../helpers/db-query');
const table = 'directions';

exports.getAll = async (conditions) => {
    const conditionTypes = {
        'like': ['name']
    };
    
    return await dbQueryHelper.getAll({
        table,
        conditions,
        conditionTypes
    });
};

exports.getDetail = async (conditions) => {
    return await dbQueryHelper.getDetail({
        table,
        conditions
    });
};

exports.insertData = async (data) => {
    const protectedColumns = ['id'];

    return await dbQueryHelper.insertData({
        table,
        data,
        protectedColumns
    });
};

exports.insertManyData = async (data) => {
    const protectedColumns = ['id'];

    return await dbQueryHelper.insertManyData({
        table,
        data,
        protectedColumns
    });
};

exports.insertUpdateData = async (data) => {
    return await dbQueryHelper.insertDuplicateUpdateData({
        table,
        data
    });
};

exports.updateData = async (data, conditions) => {
    const protectedColumns = ['id'];

    return await dbQueryHelper.updateData({
        table,
        data,
        conditions,
        protectedColumns
    });
};

exports.deleteData = async (conditions) => {
    return await dbQueryHelper.deleteData({
        table,
        conditions
    });
};
