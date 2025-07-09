const mysql = require('mysql2');
const config = require('./index');

const { database } = config;

const options = {
    host: database.host,
    port: database.port,
    user: database.username,
    password: database.password,
    database: database.name,
    connectionLimit: 10,
    charset: 'UTF8MB4_GENERAL_CI',
    // Allow multiple mysql statements per query
    multipleStatements: true,
    // Force date types (TIMESTAMP, DATETIME, DATE) to be returned as strings rather then inflated into JavaScript Date objects
    dateStrings: true
};

const pool = mysql.createPool(options);

module.exports = pool;
