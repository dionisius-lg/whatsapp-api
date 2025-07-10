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
    schedule: {
        service: parseInt(process.env.SCHEDULE_SERVICE || '0'),
        cron_resend_failed_inbound: (process.env.SCHEDULE_CRON_RESEND_FAILED_INBOUND || '*/2 * * * *'),
        cron_resend_failed_notification: (process.env.SCHEDULE_CRON_RESEND_FAILED_NOTIFICATION || '*/5 * * * *'),
        cron_update_template_status: (process.env.SCHEDULE_CRON_UPDATE_TEMPLATE_STATUS || '*/10 * * * *')
    },
    file_dir: process.env.FILE_DIR || '/',
    secret: process.env.SECRET_KEY || 'secret'
};

module.exports = config;
