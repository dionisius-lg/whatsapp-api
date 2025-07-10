const dbQueryHelper = require('./../helpers/db-query');
const table = 'app_clients';

exports.getAll = async (conditions) => {
    const conditionTypes = {
        'like': ['name']
    };

    let customConditions = [];

    if (conditions?.user_id && conditions.user_id === 'NOT NULL') {
        customConditions.push(`${table}.user_id IS NOT NULL AND user_id <> 0`);
        delete conditions.user_id;
    }

    return await dbQueryHelper.getAll({
        table,
        conditions,
        conditionTypes,
        customConditions,
        cc: 1
    });
};

exports.getDetail = async (conditions) => {
    if (conditions?.user_id && conditions.user_id === 'NOT NULL') {
        customConditions.push(`${table}.user_id IS NOT NULL AND user_id <> 0`);
        delete conditions.user_id;
    }

    return await dbQueryHelper.getDetail({
        table,
        conditions,
        customConditions,
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
    return await dbQueryHelper.updateData({
        table,
        conditions,
        cc: 1
    });
};
