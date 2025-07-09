const dbQueryHelper = require('./../helpers/db-query');
const table = 'wa_imports';

exports.getAll = async (conditions) => {
    return await dbQueryHelper.getAll({
        table,
        conditions,
        cc: 1
    });
};

exports.getDetail = async (conditions) => {
    return await dbQueryHelper.getDetail({
        table,
        conditions,
        cc: 1
    });
};

exports.insertData = async (data) => {
    const protectedColumns = ['id'];

    return await dbQueryHelper.insertData({
        table,
        data,
        protectedColumns,
        cc: 1
    });
};

exports.insertManyData = async (data) => {
    const protectedColumns = ['id'];

    return await dbQueryHelper.insertManyData({
        table,
        data,
        protectedColumns,
        cc: 1
    });
};

exports.insertUpdateData = async (data) => {
    return await dbQueryHelper.insertDuplicateUpdateData({
        table,
        data,
        cc: 1
    });
};

exports.updateData = async (data, conditions) => {
    const protectedColumns = ['id'];

    return await dbQueryHelper.updateData({
        table,
        data,
        conditions,
        protectedColumns,
        cc: 1
    });
};

exports.deleteData = async (conditions) => {
    return await dbQueryHelper.deleteData({
        table,
        conditions,
        cc: 1
    });
};
