const crypto = require('crypto');
const config = require('./../config');

const { createCipheriv, createDecipheriv } = crypto;
const { secret } = config;

const algorithm = 'aes-256-cbc';
const key = Buffer.from(secret);
const iv = 'initVector16Bits';

exports.encrypt = (value = '') => {
    const cipher = createCipheriv(algorithm, key, iv);

    return cipher.update(value, 'utf8', 'hex') + cipher.final('hex');
};

exports.decrypt = (value = '') => {
    const decipher = createDecipheriv(algorithm, key, iv);

    return decipher.update(value, 'hex', 'utf8') + decipher.final('utf8');
};
