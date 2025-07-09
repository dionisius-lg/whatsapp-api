const dbQueryHelper = require('./../helpers/db-query');
const table = 'messages';

exports.getAll = async (conditions) => {
    let customConditions = [];
    
    if (typeof conditions?.sent === 'string' && (conditions.sent).toUpperCase() === 'NULL') {
        customConditions.push(`${table}.sent IS NULL`);
        delete conditions.sent;
    }

    return await dbQueryHelper.getAll({
        table,
        conditions,
        customConditions
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
