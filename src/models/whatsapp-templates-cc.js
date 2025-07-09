const dateFormat = require('dateformat');
const dbQueryHelper = require('./../helpers/db-query');
const table = 'wa_templates';

exports.getAll = async (conditions) => {
    const conditionTypes = {
        'like': ['label'],
        'date': []
    };

    let columnDeselect = [
        'header',
        'body',
        'footer',
        'button',
        'updated_at',
        'updated_by'
    ];

    let customConditions = [];
    let customColumns = [];

    if (conditions?.start && !isNaN(conditions.start)) {
        let start = dateFormat(conditions.start * 1000, 'yyyy-mm-dd');
        let end = start;

        if (conditions?.end && !isNaN(conditions.end) && conditions.end >= conditions.start) {
            end = dateFormat(conditions.end * 1000, 'yyyy-mm-dd');
        }

        customConditions.push(`(${table}.created_at BETWEEN '${start} 00:00:00' AND '${end} 23:59:59')`);
    }

    if (conditions?.except_id) {
        customConditions.push(`${table}.id != '${conditions.except_id}'`);
        delete conditions.except_id;
    }

    if (conditions?.category_id) {
        customConditions.push(`${table}.campaign_category_id = '${conditions.category_id}'`);
        delete conditions.category_id;
    }

    if (conditions?.with_header) {
        if (conditions.with_header?.toString() === '1') {
            columnDeselect = columnDeselect.filter((item) => item !== 'header');
            customColumns.push(`UPPER(JSON_UNQUOTE(JSON_EXTRACT(${table}.header, '$.format'))) AS header_format`);
            customColumns.push(`JSON_UNQUOTE(JSON_EXTRACT(${table}.header, '$.body')) AS header_body`);
        }

        delete conditions.with_header;
    }

    if (conditions?.with_body) {
        if (conditions.with_body?.toString() === '1') {
            columnDeselect = columnDeselect.filter((item) => item !== 'body');
        }

        delete conditions.with_body;
    }

    if (conditions?.with_footer) {
        if (conditions.with_footer?.toString() === '1') {
            columnDeselect = columnDeselect.filter((item) => item !== 'footer');
        }

        delete conditions.with_footer;
    }

    if (conditions?.with_button) {
        if (conditions.with_button?.toString() === '1') {
            columnDeselect = columnDeselect.filter((item) => item !== 'button');
        }

        delete conditions.with_button;
    }

    return await dbQueryHelper.getAll({
        table,
        conditions,
        conditionTypes,
        columnDeselect,
        customConditions,
        customColumns,
        cc: 1
    });
};

exports.getDetail = async (conditions) => {
    let columnDeselect = [
        'header',
        'body',
        'footer',
        'button',
        'updated_at',
        'updated_by'
    ];

    let customConditions = [];
    let customColumns = [];

    if (conditions?.category_id) {
        customConditions.push(`${table}.campaign_category_id = '${conditions.category_id}'`);
        delete conditions.category_id;
    }

    if (conditions?.template_id) {
        customConditions.push(`(${table}.template_id = '${conditions.template_id}' OR ${table}.waba_template_id = '${conditions.template_id}')`);
        delete conditions.template_id;
    }

    if (conditions?.with_header) {
        if (conditions.with_header?.toString() === '1') {
            columnDeselect = columnDeselect.filter((item) => item !== 'header');
            customColumns.push(`UPPER(JSON_UNQUOTE(JSON_EXTRACT(${table}.header, '$.format'))) AS header_format`);
            customColumns.push(`JSON_UNQUOTE(JSON_EXTRACT(${table}.header, '$.body')) AS header_body`);
        }

        delete conditions.with_header;
    }

    if (conditions?.with_body) {
        if (conditions.with_body?.toString() === '1') {
            columnDeselect = columnDeselect.filter((item) => item !== 'body');
        }

        delete conditions.with_body;
    }

    if (conditions?.with_footer) {
        if (conditions.with_footer?.toString() === '1') {
            columnDeselect = columnDeselect.filter((item) => item !== 'footer');
        }

        delete conditions.with_footer;
    }

    if (conditions?.with_button) {
        if (conditions.with_button?.toString() === '1') {
            columnDeselect = columnDeselect.filter((item) => item !== 'button');
        }

        delete conditions.with_button;
    }

    return await dbQueryHelper.getDetail({
        table,
        conditions,
        columnDeselect,
        customConditions,
        customColumns,
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
