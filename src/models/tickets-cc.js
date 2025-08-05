const dbQueryHelper = require('./../helpers/db-query');
const table = 'tickets';

exports.getAll = async (conditions) => {
    let customConditions = [];

    if (conditions.except_ticket_status_id !== undefined) {
        if (Array.isArray(conditions.except_ticket_status_id)) {
            customConditions.push(`${table}.ticket_status_id NOT IN (${(conditions.except_ticket_status_id).join(',')})`);
        } else {
            customConditions.push(`${table}.ticket_status_id != '${conditions.except_ticket_status_id}'`);
        }

        delete conditions.except_ticket_status_id;
	}

    return await dbQueryHelper.getAll({
        table,
        conditions,
        customConditions,
        cc: 1
    });
};

exports.getDetail = async (conditions) => {
    let customConditions = [];

    if (conditions.except_ticket_status_id !== undefined) {
        if (Array.isArray(conditions.except_ticket_status_id)) {
            customConditions.push(`${table}.ticket_status_id NOT IN (${(conditions.except_ticket_status_id).join(',')})`);
        } else {
            customConditions.push(`${table}.ticket_status_id != '${conditions.except_ticket_status_id}'`);
        }

        delete conditions.except_ticket_status_id;
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
    return await dbQueryHelper.deleteData({
        table,
        conditions,
        cc: 1
    });
};
