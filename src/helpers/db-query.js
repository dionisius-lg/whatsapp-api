const _ = require('lodash');
const dateFormat = require('dateformat');
const mysql = require('mysql2');
const config = require('./../config');
const pool = require('./../config/pool');
const poolCc = require('./../config/pool-cc');
const cacheHelper = require('./../helpers/cache');
const requestHelper = require('./../helpers/request');
const valueHelper = require('./../helpers/value');

const { escape } = mysql;
const { database, database_cc, cache } = config;
const { isEmpty } = valueHelper;

const cacheTableExceptions = ['blaclist_contacts', 'break_histories', 'calls', 'configs', 'content_shortcodes', 'customers', 'customer_contacts', 'customer_refresh_tokens', 'dashboard_tickets', 'dashboard_ticket_histories', 'emails', 'extensions', 'facebook_accounts', 'facebook_messengers', 'field_types', 'hold_histories', 'instagram_accounts', 'instagram_messengers', 'livechats', 'medias', 'media_attachments', 'modules', 'module_activities', 'queues', 'queue_members', 'shifts', 'sms', 'tickets', 'ticket_attachments', 'ticket_histories', 'ticket_medias', 'ticket_statuses', 'ticket_surveys', 'ticket_survey_details', 'users', 'user_activities', 'user_escort', 'user_events', 'user_levels', 'user_level_modules', 'user_log_activities', 'voice_logs', 'wa_broadcast', 'whatsapps', 'whatsapps_profile', 'whatsapps_received_contacts', 'whatsapps_received_locations', 'whatsapps_verticals', 'work_schedules', 'work_schedule_details'];

exports.checkColumn = ({
    table = '',
    cc = 0
}) => {
    return new Promise((resolve) => {
        if (isEmpty(table)) {
            return resolve([]);
        }

        const dbName = parseInt(cc, 10) !== 1 ? database.name : database_cc.name;
        const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;
        const query = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = '${table}'`;

        dbPool.getConnection((err, conn) => {
            if (err) {
                console.error('Error pool connection:', err);

                return resolve([]);
            }

            conn.query(query, (err, result) => {
                conn.release();

                if (err) {
                    console.error('Error pool query:', err);

                    return resolve([]);
                }

                if (!result || isEmpty(result)) {
                    return resolve([]);
                }

                const columns = result.map((row) => row.COLUMN_NAME);

                return resolve(columns);
            });
        });
    });
};

exports.checkCustomField = ({
    table = '',
    cc = 0
}) => {
    return new Promise((resolve) => {
        if (isEmpty(table)) {
            return resolve([]);
        }

        const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;
        const query = `SELECT * FROM custom_fields WHERE is_active = 1 AND source_table = '${table}'`;

        dbPool.getConnection((err, conn) => {
            if (err) {
                console.error('Error pool connection:', err);

                return resolve([]);
            }

            conn.query(query, (err, result) => {
                conn.release();

                if (err) {
                    console.error('Error pool query:', err);

                    return resolve([]);
                }

                if (!result || isEmpty(result)) {
                    return resolve([]);
                }

                const columns = result.map((row) => ({
                    field_key: row.field_key,
                    field_type_id: row.field_type_id
                }));

                return resolve(columns);
            });
        });
    });
};

exports.countData = ({
    table = '',
    conditions = {},
    conditionTypes = { like: [], date: [] },
    customConditions = [],
    attributeColumn = '',
    customDropdownFields = [],
    customAttribute = [],
    join = [],
    groupBy = [],
    having = [],
    cc = 0
}) => {
    return new Promise((resolve) => {
        if (isEmpty(table)) {
            return resolve(0);
        }

        let setCond = [];
        let setCustomCond = [];
        let queryCond = '';
        let query = `SELECT COUNT(*) AS count FROM ${table}`;
        let queryCount = '';

        if (!isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery = _.join(join, ' ');
            query += ` ${joinQuery}`;
        }
        
        if (!isEmpty(conditions)) {
            for (let key in conditions) {
                if (!isEmpty(conditionTypes)) {
                    if (_.indexOf(conditionTypes.date, key) >= 0) {
                        const d = new Date();
                        const dateVal = (_.toNumber(conditions[key]) > 0) ? dateFormat(conditions[key] * 1000, 'yyyy-mm-dd') : dateFormat(d, 'yyyy-mm-dd');
                        setCond.push(`DATE(${table}.${key}) = ${escape(dateVal)}`);
                    } else if (_.indexOf(conditionTypes.like, key) >= 0) {
                        let keyLike = `%${conditions[key]}%`;
                        setCond.push(`${table}.${key} LIKE ${escape(keyLike)}`);
                    } else {
                        let isArray = conditions[key].constructor === Array;
                        
                        if (isArray) {
                            setCond.push(`${table}.${key} IN (${escape(conditions[key])})`);
                        } else {
                            setCond.push(`${table}.${key} = ${escape(conditions[key])}`);
                        }
                    }
                } else {
                    let isArray = conditions[key].constructor === Array;
                        
                    if (isArray) {
                        setCond.push(`${table}.${key} IN (${escape(conditions[key])})`);
                    } else {
                        setCond.push(`${table}.${key} = ${escape(conditions[key])}`);
                    }
                }
            }
            
            queryCond = _.join(setCond, ' AND ');
            query += ` WHERE ${queryCond}`;
        }
        
        if (!isEmpty(attributeColumn)) {
            // for custom attributes
            let queryLine;

            if (!isEmpty(customAttribute)) {
                for (let key in customAttribute) {
                    if (_.indexOf(customDropdownFields, key) >= 0) {
                        queryLine = `JSON_EXTRACT(${table}.${attributeColumn}, '$.${key}.id') = ${escape(customAttribute[key])}`;
                    } else {
                        queryLine = `LOWER(JSON_VALUE(${table}.${attributeColumn}, '$.${key}')) = LOWER(${escape(customAttribute[key])})`;
                    }

                    setCustomCond.push(queryLine);
                }

                queryCond = _.join(setCustomCond, ' AND ');
                
                if (!isEmpty(conditions)) {
                    query += ` AND ${queryCond}`;
                } else {
                    query += ` WHERE ${queryCond}`;
                }
            }
        }

        if (!isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            queryCond = ' WHERE ' + _.join(customConditions, ' AND ');

            if (!isEmpty(conditions) || !isEmpty(setCustomCond)) {
                queryCond = ' AND ' + _.join(customConditions, ' AND ');
            }

            query += `${queryCond}`;
        }

        if (!isEmpty(groupBy) && _.isArrayLikeObject(groupBy)) {
            let columnGroup = _.join(groupBy, ', ');
            query += ` GROUP BY ${columnGroup}`;

            if (!isEmpty(having) && _.isArrayLikeObject(having)) {
                let havingClause = _.join(having, ' AND ');
                query += ` HAVING ${havingClause}`;
            }

            queryCount = `SELECT COUNT(*) AS count FROM (${query}) AS count`;
            query = queryCount;
        }

        const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;

        dbPool.getConnection((err, conn) => {
            if (err) {
                console.error('Error pool connection:', err);

                return resolve(0);
            }

            conn.query(query, (err, result) => {
                conn.release();

                if (err) {
                    console.error('Error pool query:', err);

                    return resolve(0);
                }

                if (!result || isEmpty(result)) {
                    return resolve(0);
                }

                const { count } = result[0];
            
                return resolve(count || 0);
            });
        });
    });
};

exports.getAll = async ({
    table = '',
    conditions = {},
    conditionTypes = { like: [], date: [] },
    customConditions = [],
    columnSelect = [],
    columnDeselect = [],
    customColumns = [],
    attributeColumn = '',
    join = [],
    groupBy = [],
    customOrders = [],
    having = [],
    cacheKey = '',
    cc = 0
}) => {
    let res = {
        total_data: 0,
        data: false
    };

    if (isEmpty(table)) {
        return res;
    }

    try {
        let columns = await this.checkColumn({ table, cc });
        const masterColumns = columns;
        let column = '';
        let customAttribute = { ...conditions };
        const sortData = ['ASC', 'DESC'];
        let order = (!isEmpty(conditions.order)) ? conditions.order : columns[0];
        order = (_.indexOf(columns, order) >= 0) ? order : columns[0];

        if (conditions.order == false) {
            order = false;
        }

        const sort = (_.indexOf(sortData, _.toUpper(conditions.sort)) >= 0) ? _.toUpper(conditions.sort) : 'ASC';
        let limit = (conditions.limit > 0) ? conditions.limit : 20;

        if (conditions.limit == false) {
            limit = false;
        }

        let page = (conditions.page > 0) ? conditions.page : 1;
        let setCond = [];
        let queryCond = '';
        let getCustomFields = [];
        let customFields = [];
        let customDropdownFields = [];

        if (!isEmpty(attributeColumn)) {
            getCustomFields = await this.checkCustomField({ table, cc });
            customFields = _.map(getCustomFields, 'field_key');
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 });
            customDropdownFields = _.map(getDropdownColumn, 'field_key');
            customAttribute = requestHelper.filterColumn(customAttribute, customFields);
        }

        if (!isEmpty(columnSelect) && _.isArrayLikeObject(columnSelect)) {
            // filter data from all table columns, only keep selected columns
            let validColumn = _.intersection(columnSelect, columns);
            columns = validColumn;
        }

        if (!isEmpty(columnDeselect) && _.isArrayLikeObject(columnDeselect)) {
            if (_.indexOf(columnDeselect, '*') >= 0) {
                // filter data, exclude all columns
                columns = [];
            } else {
                // filter data, get column to exclude from valid selected columns or table columns
                let deselectedColumn = _.intersection(columnDeselect, columns);
                // filter data, exclude deselected columns
                let selectedColumn = _.difference(columns, deselectedColumn);
                columns = selectedColumn;
            }
        }

        if (!isEmpty(join) && _.isArrayLikeObject(join)) {
            // give prefix table to table columns
            let prefixColumn = columns.map(function (col) {
                return `${table}.${col}`;
            });

            columns = prefixColumn;
        }

        column = _.join(columns, ', ');
        
        if (!isEmpty(customFields)) {
            let customField = '';
            let setCustomField = [];

            for (let key in customFields) {
                if (_.indexOf(customDropdownFields, customFields[key]) >= 0) {
                    setCustomField.push(`CONCAT_WS('||', JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}.id')), JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}.value'))) AS ${customFields[key]}`);
                } else {
                    setCustomField.push(`JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}')) AS ${customFields[key]}`);
                }
            }

            customField = _.join(setCustomField, ', ');

            if (!isEmpty(column)) {
                column += `, ${customField}`;
            } else {
                column += `${customField}`;
            }
        }

        if (!isEmpty(customColumns) && _.isArrayLikeObject(customColumns)) {
            if (_.isEmpty(columns)) {
                column += _.join(customColumns, ', ');
            } else {
                column += ', ' + _.join(customColumns, ', ');
            }
        }

        let query = `SELECT ${column} FROM ${table}`;

        if (!isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery = _.join(join, ' ');
            query += ` ${joinQuery}`;
        }

        // remove invalid column from conditions
        conditions = requestHelper.filterColumn(conditions, masterColumns);
        
        if (!isEmpty(conditions)) {
            for (let key in conditions) {
                if (!isEmpty(conditionTypes)) {
                    if (_.indexOf(conditionTypes.date, key) >= 0) {
                        const d = new Date();
                        const dateVal = (_.toNumber(conditions[key]) > 0) ? dateFormat(conditions[key] * 1000, 'yyyy-mm-dd') : dateFormat(d, 'yyyy-mm-dd');
                        setCond.push(`DATE(${table}.${key}) = ${escape(dateVal)}`);
                    } else if (_.indexOf(conditionTypes.like, key) >= 0) {
                        let keyLike = `%${conditions[key]}%`;
                        setCond.push(`${table}.${key} LIKE ${escape(keyLike)}`);
                    } else {
                        let isArray = conditions[key].constructor === Array;

                        if (isArray) {
                            setCond.push(`${table}.${key} IN (${escape(conditions[key])})`);
                        } else {
                            setCond.push(`${table}.${key} = ${escape(conditions[key])}`);
                        }
                    }
                } else {
                    let isArray = conditions[key].constructor === Array;
                        
                    if (isArray) {
                        setCond.push(`${table}.${key} IN (${escape(conditions[key])})`);
                    } else {
                        setCond.push(`${table}.${key} = ${escape(conditions[key])}`);
                    }
                }
            }
        }
        
        if (!isEmpty(attributeColumn)) {
            // for custom attributes
            let queryLine;

            for (let key in customAttribute) {
                if (customFields.indexOf(key) >= 0) {
                    if (_.indexOf(customDropdownFields, key) >= 0) {
                        queryLine = `JSON_EXTRACT(${table}.${attributeColumn}, '$.${key}.id') = ${escape(customAttribute[key])}`;
                    } else {
                        queryLine = `LOWER(JSON_VALUE(${table}.${attributeColumn}, '$.${key}')) = LOWER(${escape(customAttribute[key])})`;
                    }

                    setCond.push(queryLine);
                }
            }
        }

        queryCond = _.join(setCond, ' AND ');
        query += (!isEmpty(queryCond)) ? ` WHERE ${queryCond}` : '';

        if (!isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            queryCond = ' WHERE ' + _.join(customConditions, ' AND ');

            if (!isEmpty(conditions) || !isEmpty(setCond)) {
                queryCond = ' AND ' + _.join(customConditions, ' AND ');
            }

            query += `${queryCond}`;
        }
        
        if (!isEmpty(groupBy) && _.isArrayLikeObject(groupBy)) {
            let columnGroup = _.join(groupBy, ', ');
            query += ` GROUP BY ${columnGroup}`;

            if (!isEmpty(having) && _.isArrayLikeObject(having)) {
                let havingClause = _.join(having, ' AND ');
                query += ` HAVING ${havingClause}`;
            }
        }

        if (!isEmpty(customOrders) && _.isArrayLikeObject(customOrders)) {
            query += ` ORDER BY ${customOrders}`;
        } else {
            if (order !== undefined && !isEmpty(order)) {
                let orderColumn = order;

                if (!isEmpty(join) && _.isArrayLikeObject(join)) {
                    orderColumn = `${table}.${order}`;
                }

                query += ` ORDER BY ${orderColumn} ${sort}`;
            }
        }

        if (limit > 0) {
            const offset = (limit * page) - limit;

            if (_.isInteger(offset) && offset >= 0) {
                query += ` LIMIT ${limit} OFFSET ${offset}`;
            } else {
                query += ` LIMIT ${limit}`;
            }
        }
        
        let countData = await this.countData({ table, conditions, conditionTypes, customConditions, customAttribute, customFields, customDropdownFields, attributeColumn, join, groupBy, having });
        let getCache = 0;

        if (cache.service === 1 && cacheTableExceptions.indexOf(table) < 0) {
            const key = cacheKey || `${table}:all`;
            getCache = await cacheHelper.getDataQuery({ key: key, field: query });
        }

        return new Promise((resolve) => {
            if (getCache) {
                // get data from cache
                return resolve(getCache);
            }

            const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;

            dbPool.getConnection((err, conn) => {
                if (err) {
                    console.error('Error pool connection:', err);

                    return resolve(res);
                }

                conn.query(query, (err, result) => {
                    conn.release();

                    if (err) {
                        console.error('Error pool query:', err);

                        return resolve(res);
                    }

                    const data = {
                        total_data: countData,
                        limit: limit,
                        page: page,
                        data: result
                    };

                    if (cache.service === 1 && cacheTableExceptions.indexOf(table) < 0) {
                        cacheHelper.setDataQuery({ key: `${table}:all`, field: query, data });
                    }

                    resolve(data);
                });
            });
        });
    } catch {
        return res;
    }
};

exports.getDetail = async ({
    table = '',
    conditions = {},
    customConditions = [],
    columnSelect = [],
    columnDeselect = [],
    customColumns = [],
    attributeColumn = '',
    join = [],
    groupBy = [],
    cacheKey = '',
    cc = 0
}) => {
    let res = {
        total_data: 0,
        data: false
    };

    try {
        let columns = await this.checkColumn({ table, cc });
        let column = '';
        let setCond = [];
        let queryCond = '';
        let getCustomFields = [];
        let customFields = [];
        let customDropdownFields = [];

        if (!isEmpty(attributeColumn)) {
            getCustomFields = await this.checkCustomField({ table, cc });
            customFields = _.map(getCustomFields, 'field_key');
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 });
            customDropdownFields = _.map(getDropdownColumn, 'field_key');
        }

        if (!isEmpty(columnSelect) && _.isArrayLikeObject(columnSelect)) {
            // filter data from all table columns, only keep selected columns
            let validColumn = _.intersection(columnSelect, columns);
            columns = validColumn;
        }

        if (!isEmpty(columnDeselect) && _.isArrayLikeObject(columnDeselect)) {
            if (_.indexOf(columnDeselect, '*') >= 0) {
                // filter data, exclude all columns
                columns = [];
            } else {
                // filter data, get column to exclude from valid selected columns or table columns
                let deselectedColumn = _.intersection(columnDeselect, columns);
                // filter data, exclude deselected columns
                let selectedColumn = _.difference(columns, deselectedColumn);
                columns = selectedColumn;
            }
        }

        if (!isEmpty(join) && _.isArrayLikeObject(join)) {
            let prefixColumn = columns.map(function (col) {
                return `${table}.${col}`;
            });

            columns = prefixColumn;
        }

        column = _.join(columns, ', ');
        
        if (!isEmpty(customFields)) {
            let customField = '';
            let setCustomField = [];
            
            for (let key in customFields) {
                if (_.indexOf(customDropdownFields, customFields[key]) >= 0) {
                    setCustomField.push(`CONCAT_WS('||', JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}.id')), JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}.value'))) AS ${customFields[key]}`);
                } else {
                    setCustomField.push(`JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}')) AS ${customFields[key]}`);
                }
            }

            customField = _.join(setCustomField, ', ');

            if (!isEmpty(column)) {
                column += `, ${customField}`;
            } else {
                column += `${customField}`;
            }
        }

        if (!isEmpty(customColumns) && _.isArrayLikeObject(customColumns)) {
            let append = '';

            if (column) {
                append = ', ';
            }

            column += append + _.join(customColumns, ', ');
        }

        let query = `SELECT ${column}`;

        if (!isEmpty(table)) {
            query += ` FROM ${table}`;
        }

        if (!isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery = _.join(join, ' ');
            query += ` ${joinQuery}`;
        }

        if (!isEmpty(conditions)) {
            for (let key in conditions) {
                let keyCondition = key;

                if (!isEmpty(join) && _.isArrayLikeObject(join)) {
                    keyCondition = `${table}.${key}`;
                }

                setCond.push(`${keyCondition} = ${escape(conditions[key])}`);
            }

            queryCond = _.join(setCond, ' AND ');

            query += ` WHERE ${queryCond}`;
        }

        if (!isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            queryCond = ' WHERE ' + _.join(customConditions, ' AND ');

            if (!isEmpty(conditions)) {
                queryCond = ' AND ' + _.join(customConditions, ' AND ');
            }

            query += `${queryCond}`;
        }

        if (!isEmpty(table) && !isEmpty(groupBy) && _.isArrayLikeObject(groupBy)) {
            let columnGroup = _.join(groupBy, ', ');
            query += ` GROUP BY ${columnGroup}`;
        }

        if (table) {
            query += ' LIMIT 1';
        }

        let getCache = 0;

        if (cache.service === 1 && table != '' && cacheTableExceptions.indexOf(table) < 0) {
            const key = cacheKey || table;
            const keyId = (conditions['id']) ? `:${conditions['id']}` : '';
            getCache = await cacheHelper.getDataQuery({ key: `${key}${keyId}`, field: query });
        }

        return new Promise((resolve) => {
            if (getCache) {
                // get data from cache
                return resolve(getCache);
            }

            const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;

            dbPool.getConnection((err, conn) => {
                if (err) {
                    console.error('Error pool connection:', err);

                    return resolve(res);
                }

                conn.query(query, (err, result) => {
                    conn.release();

                    if (err) {
                        console.error('Error pool query:', err);

                        return resolve(res);
                    }

                    if (result && !isEmpty(result)) {
                        res = {
                            total_data: 1,
                            limit: 0,
                            page: 1,
                            data: result[0]
                        };
						
                        if (cache.service === 1 && table != '' && cacheTableExceptions.indexOf(table) < 0) {
                            const key = cacheKey || table;
                            const keyId = (conditions['id']) ? `:${conditions['id']}` : '';
                            cacheHelper.setDataQuery({ key: `${key}${keyId}`, field: query, data: res });
                        }
                    }

                    return resolve(res);
                });
            });
        });
    } catch {
        return res;
    }
};

exports.insertData = async ({
    table = '',
    data = {},
    attributeColumn = '',
    protectedColumns = [],
    cacheKeys = [],
    cc = 0
}) => {
    let res = {
        total_data: 0,
        data: false
    };

    if (isEmpty(table)) {
        return res;
    }

    try {
        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()'];
        let nullChar = ['NULL', ''];
        let dataCustom = { ...data };
        const columns = await this.checkCustomField({ table, cc });
        // remove invalid column from data
        data = requestHelper.filterColumn(data, columns);
        // remove invalid data
        data = requestHelper.filterData(data);

        let getCustomFields;
        let customDropdownFields;
        let customFields = [];
        
        if (!isEmpty(attributeColumn)) {
            getCustomFields = await this.checkCustomField({ table, cc });
            customFields = _.map(getCustomFields, 'field_key');
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 });
            customDropdownFields = _.map(getDropdownColumn, 'field_key');
            dataCustom = requestHelper.filterColumn(dataCustom, customFields);
        }

        return new Promise((resolve) => {
            if (_.isEmpty(data) && _.isEmpty(dataCustom)) {
                // reject('Insert query require some data')
                return resolve(res);
            }

            let keys = Object.keys(data);
            // check protected columns on submitted data
            let forbiddenColumns = _.intersection(protectedColumns, keys);

            if (!isEmpty(forbiddenColumns)) {
                return resolve(res);
            }

            delete keys[attributeColumn];

            if (!isEmpty(dataCustom) && !isEmpty(attributeColumn)) {
                keys.push(attributeColumn);
            }

            let column = _.join(keys, ', ');

            let query = `INSERT INTO ${table} (${column}) VALUES ?`;
            let values = [];
            let dataCustomField = {};
            let tempVal = Object.keys(data).map((k) => {
                let dataVal = '';

                if (typeof data[k] !== 'undefined') {
                    dataVal = _.trim(data[k]);

                    if (_.indexOf(timeChar, _.toUpper(dataVal)) >= 0) {
                        let d = new Date();
                        dataVal = dateFormat(d, 'yyyy-mm-dd HH:MM:ss');
                    }

                    if (_.indexOf(nullChar, _.toUpper(dataVal)) >= 0) {
                        dataVal = null;
                    }
                } else {
                    dataVal = null;
                }

                return dataVal;
            });

            for (let key in dataCustom) {
                if (customFields.indexOf(key) >= 0) {
                    if (customDropdownFields.indexOf(key) >= 0) {
                        let dropdownData = dataCustom[key].split('||');
                        let dropdownId = dropdownData[0] || '';
                        let dropdownValue = dropdownData[1] || '';

                        if ((!isNaN(dropdownId) || _.isNumber(dropdownId)) && dropdownId > 0 && !isEmpty(dropdownValue)) {
                            dataCustomField[key] = { id: dropdownId, value: dropdownValue };
                        }
                    } else {
                        dataCustomField[key] = dataCustom[key];
                    }
                }
            }

            let jsonDataCustom = JSON.stringify(dataCustomField);

            if (!isEmpty(dataCustomField)) {
                tempVal.push(jsonDataCustom);
            }

            values.push(tempVal);

            const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;

            dbPool.getConnection((err, conn) => {
                if (err) {
                    console.error('Error pool connection:', err);

                    return resolve(res);
                }

                conn.query(query, [values], (err, result) => {
                    conn.release();

                    if (err) {
                        console.error('Error pool query:', err);

                        return resolve(res);
                    }

                    if (!result || isEmpty(result)) {
                        return resolve(res);
                    }

                    if (cache.service === 1) {
                        const keyData = `${table}:all`;

                        if (Array.isArray(cacheKeys) && !isEmpty(cacheKeys)) {
                            cacheKeys.push(keyData);
                            cacheHelper.deleteDataQuery({ key: cacheKeys });
                        } else {
                            cacheHelper.deleteDataQuery({ key: [keyData] });
                        }
                    }

                    res = {
                        total_data: result.affectedRows,
                        data: { id: result.insertId }
                    };

                    resolve(res);
                });
            });
        });
    } catch {
        return res;
    }
};

exports.insertManyData = async ({
    table = '',
    data = [],
    protectedColumns = [],
    cacheKeys = [],
    cc = 0
}) => {
    let res = {
        total_data: 0,
        data: false
    };

    if (isEmpty(table)) {
        return res;
    }

    try {
        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()'];
        let nullChar = ['NULL'];

        // get table columns
        const columns = await this.checkCustomField({ table, cc });
        // compare fields from data with columns
        const diff = _.difference(data[0], columns);

        return new Promise((resolve) => {
            // if data invalid object
            if (!_.isObjectLike(data) || _.isEmpty(data) || data.length === undefined) {
                return resolve(res);
            }

            // if there are invalid fields/columns
            if (!isEmpty(diff)) {
                return resolve(res);
            }

            // remove invalid data
            data[0] = requestHelper.filterData(data[0]);
            const keys = Object.keys(data[0]);

            // if key data empty
            if (_.isEmpty(keys)) {
                return resolve(res);
            }

            // check protected columns on submitted data
            const forbiddenColumns = _.intersection(protectedColumns, keys);

            if (!isEmpty(forbiddenColumns)) {
                return resolve(res);
            }

            const column = keys.join(', ');
            let query = `INSERT INTO ${table} (${column}) VALUES ?`;
            let values = [];
            let tempVal = [];

            for (let key in data) {
                // if 'key' and 'data order' on each object not the same
                if (!_.isEqual(keys, Object.keys(data[key]))) {
                    return resolve(res);
                }

                tempVal = Object.keys(data[key]).map((k) => {
                    let dataVal = '';

                    if (typeof data[key][k] !== 'undefined') {
                        dataVal = _.trim(data[key][k]);

                        if (_.indexOf(timeChar, _.toUpper(dataVal)) >= 0) {
                            let d = new Date();
                            dataVal = dateFormat(d, 'yyyy-mm-dd HH:MM:ss');
                        }

                        if (_.indexOf(nullChar, _.toUpper(dataVal)) >= 0) {
                            dataVal = null;
                        }
                    } else {
                        dataVal = null;
                    }

                    return dataVal;
                });

                values.push(tempVal);
            }

            const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;

            dbPool.getConnection((err, conn) => {
                if (err) {
                    console.error('Error pool connection:', err);

                    return resolve(res);
                }

                conn.query(query, [values], (err, result) => {
                    conn.release();

                    if (err) {
                        console.error('Error pool query:', err);

                        return resolve(res);
                    }

                    if (!result || isEmpty(result)) {
                        return resolve(res);
                    }

                    if (cache.service === 1) {
                        const keyData = `${table}:all`;

                        if (Array.isArray(cacheKeys) && !isEmpty(cacheKeys)) {
                            cacheKeys.push(keyData);
                            cacheHelper.deleteDataQuery({ key: cacheKeys });
                        } else {
                            cacheHelper.deleteDataQuery({ key: [keyData] });
                        }
                    }

                    let resultData = [];

                    for (let i = 0; i < result.affectedRows; i++) {
                        resultData.push({ id: parseInt(result.insertId) + i });
                    }

                    res = {
                        total_data: result.affectedRows,
                        data: resultData
                    };

                    resolve(res);
                });
            });
        });
    } catch {
        return res;
    }
};

exports.insertDuplicateUpdateData = async ({
    table = '',
    data = [],
    protectedColumns = [],
    cacheKeys = [],
    cc = 0
}) => {
    let res = {
        total_data: 0,
        data: false
    };

    if (isEmpty(table)) {
        return res;
    }

    try {
        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()'];
        let nullChar = ['NULL'];

        // get table columns
        const columns = await this.checkColumn({ table, cc });
        // compare fields from data with columns
        const diff = _.difference(data[0], columns);

        return new Promise((resolve) => {
            // if data invalid object
            if (!_.isObjectLike(data) || _.isEmpty(data) || data.length === undefined) {
                return resolve(res);
            }

            // if there are invalid fields/columns
            if (!isEmpty(diff)) {
                return resolve(res);
            }

            // remove invalid data
            data[0] = requestHelper.filterData(data[0]);
            const keys = Object.keys(data[0]);

            // if key data empty
            if (_.isEmpty(keys)) {
                return resolve(res);
            }

            // check protected columns on submitted data
            const forbiddenColumns = _.intersection(protectedColumns, keys);

            if (!isEmpty(forbiddenColumns)) {
                return resolve(res);
            }

            const column = keys.join(', ');
            let update = [];

            keys.forEach(function (value) {
                update.push(`${value} = VALUES(${value})`);
            });

            const updateDuplicate = _.join(update, ', ');

            let query = `INSERT INTO ${table} (${column}) VALUES ? ON DUPLICATE KEY UPDATE ${updateDuplicate}`;
            let values = [];
            let tempVal = [];

            for (let key in data) {
                // if 'key' and 'data order' on each object not the same
                if (!_.isEqual(keys, Object.keys(data[key]))) {
                    return resolve(res);
                }

                tempVal = Object.keys(data[key]).map((k) => {
                    let dataVal = '';

                    if (typeof data[key][k] !== 'undefined') {
                        dataVal = _.trim(data[key][k]);

                        if (_.indexOf(timeChar, _.toUpper(dataVal)) >= 0) {
                            let d = new Date();
                            dataVal = dateFormat(d, 'yyyy-mm-dd HH:MM:ss');
                        }

                        if (_.indexOf(nullChar, _.toUpper(dataVal)) >= 0) {
                            dataVal = null;
                        }
                    } else {
                        dataVal = null;
                    }

                    return dataVal;
                });

                values.push(tempVal);
            }

            const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;

            dbPool.getConnection((err, conn) => {
                if (err) {
                    console.error('Error pool connection:', err);

                    return resolve(res);
                }

                conn.query(query, [values], (err, result) => {
                    conn.release();

                    if (err) {
                        console.error('Error pool query:', err);

                        return resolve(res);
                    }

                    if (!result || isEmpty(result)) {
                        return resolve(res);
                    }

                    if (cache.service === 1) {
                        if (Array.isArray(cacheKeys) && !isEmpty(cacheKeys)) {
                            cacheKeys.push(table);
                            cacheHelper.deleteDataQuery({ key: cacheKeys });
                        } else {
                            cacheHelper.deleteDataQuery({ key: [table] });
                        }
                    }

                    res = {
                        total_data: result.affectedRows,
                        data: data
                    };

                    resolve(res);
                });
            });
        });
    } catch {
        return res;
    }
};

exports.updateData = async ({
    table = '',
    data = {},
    conditions = {},
    customConditions = [],
    attributeColumn = '',
    protectedColumns = [],
    cacheKeys = [],
    cc = 0
}) => {
    let res = {
        total_data: 0,
        data: false
    };

    if (isEmpty(table)) {
        return res;
    }

    try {
        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()'];
        let nullChar = ['NULL'];
        let setData = [];
        let queryData = '';
        let setCond = [];
        let queryCond = '';
        let query = `UPDATE ${table}`;
        let dataCustom = { ...data };
        let customAttribute = { ...conditions };
        const columns = await this.checkColumn({ table, cc });

        // remove invalid column from data
        data = requestHelper.filterColumn(data, columns);
        // remove invalid data
        data = requestHelper.filterData(data);

        let customFields = [];
        let getCustomFields;
        let customDropdownFields;

        if (!isEmpty(attributeColumn)) {
            getCustomFields = await this.checkCustomField({ table });
            customFields = _.map(getCustomFields, 'field_key');
            const getDropdownColumn = _.filter(getCustomFields, { field_type_id: 5 });
            customDropdownFields = _.map(getDropdownColumn, 'field_key');
            dataCustom = requestHelper.filterColumn(dataCustom, customFields);
            customAttribute = requestHelper.filterColumn(customAttribute, customFields);
        }

        return new Promise((resolve) => {
            if (_.isEmpty(conditions)) {
                // reject('Update query is unsafe without data and condition')
                if (_.isEmpty(data) && _.isEmpty(dataCustom)) {
                    return resolve(res);
                }
            }
	
            if (!isEmpty(data)) {
                const keys = Object.keys(data);
                // check protected columns on submitted data
                const forbiddenColumns = _.intersection(protectedColumns, keys);
	
                if (!isEmpty(forbiddenColumns)) {
                    return resolve(res);
                }
				
                delete data[attributeColumn];
	
                for (let key in data) {
                    let dataVal = _.trim(data[key]);
					
                    if (typeof data[key] !== 'undefined') {
                        if (_.indexOf(timeChar, _.toUpper(dataVal)) >= 0) {
                            let d = new Date();
                            dataVal = dateFormat(d, 'yyyy-mm-dd HH:MM:ss');
                        }
	
                        if (_.indexOf(nullChar, _.toUpper(dataVal)) >= 0) {
                            dataVal = null;
                        }
                    } else {
                        dataVal = null;
                    }
	
                    if (_.isEmpty(dataVal) && dataVal !== 0) {
                        setData.push(`${key} = NULL`);
                    } else {
                        setData.push(`${key} = ${escape(dataVal)}`);
                    }
                }
            }
	
            if (!isEmpty(attributeColumn)) {
                let setJsonData = [];
				
                for (let key in dataCustom) {
                    if (customFields.indexOf(key) >= 0) {
                        if (customDropdownFields.indexOf(key) >= 0) {
                            let dropdownData = dataCustom[key].split('||');
                            let dropdownId = dropdownData[0] || '';
                            let dropdownValue = dropdownData[1] || '';
	
                            if ((!isNaN(dropdownId) || _.isNumber(dropdownId)) && dropdownId > 0 && !isEmpty(dropdownValue)) {
                                setJsonData.push(`'$.${key}', JSON_OBJECT('id', ${escape(_.parseInt(dropdownId))}, 'value', ${escape(dropdownValue)})`);
                            } else {
                                setJsonData.push(`'$.${key}', JSON_OBJECT('id', '', 'value', '')`);
                            }
                        } else {
                            setJsonData.push(`'$.${key}', ${escape(dataCustom[key])}`);
                        }
                    }
                }
	
                let joinData = _.join(setJsonData, ', ');
	
                if (!isEmpty(joinData)) {
                    setData.push(`${attributeColumn} = JSON_SET(COALESCE(${attributeColumn}, '{}'), ${joinData})`);
                }
            }
	
            queryData = _.join(setData, ', ');
            query += ` SET ${queryData}`;
	
            if (!isEmpty(conditions)) {
                for (let key in conditions) {
                    if (_.isArray(conditions[key])) {
                        setCond.push(`${key} IN (${_.trim(conditions[key].join(','))})`);
                    } else {
                        setCond.push(`${key} = ${escape(_.trim(conditions[key]))}`);
                    }
                }
            }
	
            if (!isEmpty(attributeColumn)) {
                // for custom attributes
                for (let key in customAttribute) {
                    if (customFields.indexOf(key) >= 0) {
                        let queryLine = `JSON_EXTRACT(${attributeColumn}, '$.${key}') = ${escape(customAttribute[key])}`;
                        setCond.push(queryLine);
                    }
                }
            }
			
            queryCond = _.join(setCond, ' AND ');
            query += ` WHERE ${queryCond}`;
			
            if (!isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
                queryCond = ' WHERE ' + _.join(customConditions, ' AND ');
	
                if (!isEmpty(conditions)) {
                    queryCond = ' AND ' + _.join(customConditions, ' AND ');
                }
	
                query += `${queryCond}`;
            }

            const dbOptions = parseInt(cc, 10) !== 1 ? database.options : database_cc.options;
            const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;

            const executeUpdateQuery = (retryCount) => {
                dbPool.getConnection((err, conn) => {
                    if (err) {
                        console.error('Error pool connection:', err);

                        return resolve(res);
                    }

                    conn.query(query, (err, result) => {
                        conn.release();

                        if (err) {
                            console.error('Error pool query:', err);
                            timeoutSeconds = Math.floor(Math.random() * (dbOptions.max_timeout - dbOptions.min_timeout + 1) + dbOptions.min_timeout) * 1000; //set timeout randomly
                            
                            // Check if the error is a deadlock error
                            if ((err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_LOCK_WAIT_TIMEOUT' || err.code === 'ER_LOCK_TIMEOUT') && retryCount < dbOptions.retry_attempt) {
                                console.error(`Deadlock detected. Retrying (${retryCount + 1}/${dbOptions.retry_attempt})...`);
        
                                // Add a delay before retrying
                                setTimeout(() => {
                                    executeUpdateQuery(retryCount + 1);
                                }, timeoutSeconds);
                                
                                return;
                            } else {
                                return resolve(res);
                            }
                        }

                        if (!result || isEmpty(result)) {
                            return resolve(res);
                        }

                        if (cache.service === 1) {
                            const keyData = `${table}:all`;
                            const keyId = conditions['id'] || '';
            
                            if (Array.isArray(cacheKeys) && !isEmpty(cacheKeys)) {
                                cacheKeys.push(keyData);
            
                                if (keyId) {
                                    cacheKeys.push(`${table}:${keyId}`);
                                }
            
                                cacheHelper.deleteDataQuery({ key: cacheKeys });
                            } else {
                                const keyToDelete = [keyData];
            
                                if (keyId) {
                                    keyToDelete.push(`${table}:${keyId}`);
                                }
            
                                cacheHelper.deleteDataQuery({ key: keyToDelete });
                            }
                        }
            
                        res = {
                            total_data: result.affectedRows,
                            data: conditions
                        };
            
                        if (res.total_data < 1 || result.warningCount) {
                            res.data = false;
                        }
            
                        resolve(res);
                    });
                });
            };

            // Start the initial execution
            executeUpdateQuery(0);
        });
    } catch {
        return res;
    }
};

exports.updateManyData = async ({
    table = '',
    data = [],
    idColumns = ['id'],
    protectedColumns = [],
    cacheKeys = [],
    cc = 0
}) => {
    let res = {
        total_data: 0,
        data: false
    };

    if (isEmpty(table)) {
        return res;
    }

    try {
        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()'];
        let nullChar = ['NULL'];

        // get table columns
        const columns = await this.checkColumn({ table, cc });
        // compare fields from data with columns
        const diff = _.difference(data[0], columns);

        return new Promise((resolve) => {
            // if data invalid object
            if (!_.isObjectLike(data) || _.isEmpty(data) || data.length === undefined) {
                return resolve(res);
            }

            // if there are invalid fields/columns
            if (!isEmpty(diff)) {
                return resolve(res);
            }
	
            // remove invalid data
            data[0] = requestHelper.filterData(data[0]);
            const keys = Object.keys(data[0]);
	
            // if key data empty
            if (_.isEmpty(keys)) {
                return resolve(res);
            }
	
            // check protected columns on submitted data
            const forbiddenColumns = _.intersection(protectedColumns, keys);
	
            if (!isEmpty(forbiddenColumns)) {
                idColumns.forEach(column => {
                    if (!forbiddenColumns.includes(column)) {
                        return resolve(res);
                    }
                });
            }
			
            const updateColumns = Object.keys(data[0]).filter(key => !idColumns.includes(key));
            let query = `UPDATE ${table} SET`;
            updateColumns.forEach((column, index) => {
                query += ` ${column} = CASE`;
				  
                data.forEach(item => {
                    let colValue = _.trim(item[column]);
	
                    if (_.indexOf(timeChar, _.toUpper(colValue)) >= 0) {
                        let d = new Date();
                        colValue = dateFormat(d, 'yyyy-mm-dd HH:MM:ss');
                    }
	
                    if (_.indexOf(nullChar, _.toUpper(colValue)) >= 0) {
                        colValue = null;
                    }
					
                    let condition = idColumns.map(idCol => `${idCol} = ${item[idCol]}`).join(' AND ');
                    query += ` WHEN ${condition} THEN ${item[column]}`;
                });
				
                query += (updateColumns[updateColumns.length - 1] != column) ? ' END,' : ' END';
            });

            const dbOptions = parseInt(cc, 10) !== 1 ? database.options : database_cc.options;
            const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;
			
            const executeUpdateQuery = (retryCount) => {
                dbPool.getConnection((err, conn) => {
                    if (err) {
                        console.error('Error pool connection:', err);

                        return resolve(res);
                    }

                    conn.query(query, (err, result) => {
                        conn.release();

                        if (err) {
                            console.error('Error pool query:', err);
                            timeoutSeconds = Math.floor(Math.random() * (dbOptions.max_timeout - dbOptions.min_timeout + 1) + dbOptions.min_timeout) * 1000; //set timeout randomly
						
                            // Check if the error is a deadlock error
                            if ((err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_LOCK_WAIT_TIMEOUT' || err.code === 'ER_LOCK_TIMEOUT') && retryCount < dbOptions.retry_attempt) {
                                console.error(`Deadlock detected. Retrying (${retryCount + 1}/${dbOptions.retry_attempt})...`);
	
                                // Add a delay before retrying
                                setTimeout(() => {
                                    executeUpdateQuery(retryCount + 1);
                                }, timeoutSeconds);
							
                                return;
                            } else {
                                return resolve(res);
                            }
                        }

                        if (!result || isEmpty(result)) {
                            return resolve(res);
                        }

                        if (cache.service === 1) {
                            if (Array.isArray(cacheKeys) && !isEmpty(cacheKeys)) {
                                cacheKeys.push(table);
                                cacheHelper.deleteData({ key: cacheKeys });
                            } else {
                                cacheHelper.deleteData({ key: [table] });
                            }
                        }
	
                        res = {
                            total_data: result.affectedRows,
                            data: data
                        };
		
                        if (res.total_data < 1 || result.warningCount) {
                            res.data = false;
                        }
					
                        resolve(res);
                    });
                });
            };
	
            // Start the initial execution
            executeUpdateQuery(0);
        });
    } catch {
        return res;
    }
};

exports.deleteData = async ({
    table = '',
    conditions = {},
    cacheKeys = [],
    cc = 0
}) => {
    let res = {
        total_data: 0,
        data: false
    };

    try {
        return new Promise((resolve) => {
            let setCond = [];
            let queryCond = '';
            let query = `DELETE FROM ${table}`;

            if (_.isEmpty(conditions)) {
                // reject('Delete query is unsafe without condition')
                return resolve(res);
            }

            for (let key in conditions) {
                setCond.push(`${key} = ${escape(conditions[key])}`);
            }

            queryCond = _.join(setCond, ' AND ');

            query += ` WHERE ${queryCond}`;

            const dbPool = parseInt(cc, 10) !== 1 ? pool : poolCc;

            dbPool.getConnection((err, conn) => {
                if (err) {
                    console.error('Error pool connection:', err);

                    return resolve(res);
                }

                conn.query(query, (err, result) => {
                    conn.release();

                    if (err) {
                        console.error('Error pool query:', err);

                        return resolve(res);
                    }

                    if (!result || isEmpty(result)) {
                        return resolve(res);
                    }

                    if (cache.service === 1) {
                        const keyData = `${table}:all`;
                        const keyId = conditions['id'] || '';

                        if (Array.isArray(cacheKeys) && !isEmpty(cacheKeys)) {
                            cacheKeys.push(keyData);

                            if (keyId) {
                                cacheKeys.push(`${table}:${keyId}`);
                            }

                            cacheHelper.deleteDataQuery({ key: cacheKeys });
                        } else {
                            const keyToDelete = [keyData];

                            if (keyId) {
                                keyToDelete.push(`${table}:${keyId}`);
                            }

                            cacheHelper.deleteDataQuery({ key: keyToDelete });
                        }
                    }

                    res = {
                        total_data: result.affectedRows,
                        data: conditions
                    };

                    if (res.total_data == 0) {
                        res.data = false;
                    }

                    resolve(res);
                });
            });
        });
    } catch {
        return res;
    }
};
