const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const config = {
    env: process.env.NODE_ENV || 'development',
    timezone: 'Asia/Jakarta',
    port: parseInt(process.env.PORT || '3000'),
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'test',
        options: {
            retry_attempt: 3,
            max_timeout: 10,
            min_timeout: 3
        }
    },
    database_cc: {
        host: process.env.DB_HOST_CC || 'localhost',
        port: parseInt(process.env.DB_PORT_CC || '3306'),
        username: process.env.DB_USER_CC || 'root',
        password: process.env.DB_PASSWORD_CC || '',
        name: process.env.DB_NAME_CC || 'test',
        options: {
            retry_attempt: 3,
            max_timeout: 10,
            min_timeout: 3
        }
    },
    cache: {
        host: process.env.CACHE_HOST || 'localhost',
        port: parseInt(process.env.CACHE_PORT || '6379'),
        db: parseInt(process.env.CACHE_DB || '0'),
        password: process.env.CACHE_PASSWORD || '',
        duration: parseInt(process.env.CACHE_DATA_DURATION || '3600'), // in seconds
        service: parseInt(process.env.CACHE_SERVICE || '0')
    },
    whatsapp: {
        url: process.env.WA_API_URL || 'localhost',
        key: process.env.WA_API_KEY || '',
        bsp: (typeof process.env.WA_API_BSP === 'string' && ['JSM', 'IVO'].includes(process.env.WA_API_BSP.trim())) ? process.env.WA_API_BSP.trim() : 'JSM'
    },
    file_dir: process.env.FILE_DIR || '/',
    secret: process.env.SECRET_KEY || 'secret'
};

module.exports = config;
