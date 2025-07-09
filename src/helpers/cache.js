const crypto = require('crypto');
const cache = require('./../config/cache');
const valueHelper = require('./value');

const { createHash } = crypto;
const { isJson, isNumeric } = valueHelper;

/**
 * check cache key and field
 * @param key - cache key
 * @param field - cache field
 * @returns Promise<boolean> - Whether the field exists in the key or not
 */
exports.checkData = async ({ key = '', field = '' }) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    try {
        const result = await client.hexist(key, field);

        return result;
    } catch (__err) {
        return false;
    }
};

/**
 * set expire data to cache
 * @param key - cache key
 * @param expire - expire value (in seconds)
 */
exports.setExpire = async ({ key = '', expire = 0 }) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    try {
        const result = await client.expire(key, expire);

        return result;
    } catch (__err) {
        return false;
    }
};

/**
 * get data from cache
 * @param key - cache key
 * @param field - cache field
 */
exports.getData = async ({ key = '', field = '' }) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    try {
        const result = await client.hmget(key, field);

        return result.trim();
    } catch (__err) {
        return false;
    }
};

/**
 * set data query result from cache
 * @param key - cache key
 * @param field - cache field
 */
exports.getDataQuery = async ({ key = '', field = '' }) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;
    const hashField = createHash('md5').update(field).digest('hex');

    try {
        const checkData = await this.checkData({ key: `DataQuery:${key}`, field: hashField });

        if (checkData == 1) {
            const getData = await client.hmget(`DataQuery:${key}`, hashField);
            let result = getData.trim();

            if (isJson(result)) {
                result = JSON.parse(result);
            }

            return result;
        }
        
        throw new Error('Not found');
    } catch (__err) {
        return false;
    }
};

/**
 * set data to cache
 * @param key - cache key
 * @param field - cache field
 * @param value - cache data
 * @param expire - expire value (in seconds)
 */
exports.setData = async ({ key = '', field = '', data = {}, expire = 0}) => {
    if (!cache.connected) {
        return false;
    }

    const { client, duration } = cache;

    try {
        const result = await client.hmset(key, field, data);

        switch (true) {
            case (isNumeric(expire) && expire > 0):
                await this.setExpire({ key, expire });
                break;
            default:
                await this.setExpire({ key, expire: duration });
                break;
        }

        return result;
    } catch (__err) {
        return false;
    }
};

/**
 * set data query result to cache
 * @param key - cache key
 * @param field - cache field
 * @param data - cache data
 * @param expire - expire value (in seconds)
 */
exports.setDataQuery = async ({ key = '', field = '', data = {}, expire = 0 }) => {
    if (!cache.connected) {
        return false;
    }

    const { client, duration } = cache;
    const hashField = createHash('md5').update(field).digest('hex');

    try {
        const result = await client.hmset(`DataQuery:${key}`, hashField, JSON.stringify(data));

        switch (true) {
            case (isNumeric(expire) && expire > 0):
                await this.setExpire({ key: `DataQuery:${key}`, expire });
                break;
            default:
                await this.setExpire({ key: `DataQuery:${key}`, expire: duration });
                break;
        }

        return result;
    } catch (__err) {
        return false;
    }
};

/**
 * delete data from cacha key
 * @param {string[]} key - cache key
 */
exports.deleteData = async ({ key = [] }) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    for (let i in key) {
        await client.del(key[i]);
    }

    return key.length;
};

/**
 * delete data from cache key field
 * @param {string} key - cache key
 * @param {string[]} field - cache field
 */
exports.deleteField = async ({ key = '', field = [] }) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    for (let i in field) {
        await client.hdel(key, field[i]);
    }

    return key;
};

/**
 * delete data from cache
 * @param {string[]} key - cache key
 */
exports.deleteDataQuery = async ({ key = [] }) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    try {
        for (let i in key) {
            await client.del(`DataQuery:${key[i]}`);
        }

        return key.length;
    } catch (__err) {
        return false;
    }
};
