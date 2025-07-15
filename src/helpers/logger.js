const dateFormat = require('dateformat');
const morgan = require('morgan');
const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const rfs = require('rotating-file-stream');
const path = require('path');
const valueHelper = require('./value');

const createWinstonLogger = (type = 'success') => {
    const logDir = path.resolve('./', 'logs', type);

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const transport = new winston.transports.DailyRotateFile({
        filename: path.resolve(logDir, `${type}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true, // gzip compressed
        maxFiles: (3 * 31) + 'd', // keep 3 months of logs
        auditFile: path.resolve(logDir, `${type}-audit.json`)
    });

    transport.on('rotate', (oldFile, newFile) => {
        console.log(`[logger] Rotate ${type} log: ${oldFile} to ${newFile}`);
    });

    const logger = winston.createLogger({
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf((log) => `${log.timestamp} ${JSON.stringify(log.message)}`)
        ),
        transports: [
            new winston.transports.Console(),
            transport
        ]
    });

    return logger;
};

const cacheWinstonLogger = {};

const winstonLogger = (type = 'success') => {
    if (cacheWinstonLogger[type]) {
        return cacheWinstonLogger[type];
    }

    const logger = createWinstonLogger(type);
    cacheWinstonLogger[type] = logger;

    return logger;
};

exports.access = (app) => {
    const logDir = path.resolve('./', 'logs/access');

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const logName = (time) => {
        if (time) {
            return ['access', dateFormat(time, 'yyyy-mm-dd'), '.log', '.gz'].join('-');
        }

        return 'access.log';
    };

    const logStream = rfs.createStream(logName, {
        interval: '1d', // rotate daily
        path: logDir, // log path
        compress: 'gzip', // compress old file
        maxFiles: (3 * 31) // max files to keep
    });

    morgan.token('body', (req) => {
        let { body } = req;

        if (body) {
            if (typeof body === 'object') {
                body = valueHelper.maskSensitiveData(body);
            }

            return JSON.stringify(body);
        }

        return '';
    });

    morgan.token('date', () => {
        return dateFormat(new Date(), 'yyyy-mm-dd HH:mm:ss');
    });

    morgan.token('secret', (req) => {
        return req.headers && req.headers['x-api-key'];
    });

    app.use(morgan(':remote-addr :remote-user [:date] :status [secret=:secret] ":method :url HTTP/:http-version" :body :response-time ms - :res[content-length] ', { stream: logStream }));
};

exports.success = ({ from = 'server', message = '', result = null }) => {
    const logger = winstonLogger('success');
    let log = { from, message };

    if (!valueHelper.isEmpty(result)) {
        log.result = result;
    }

    logger.info({ log });
};

exports.error = ({ from = 'server', message = '', result = null }) => {
    const logger = winstonLogger('error');
    let log = { from, message };

    if (!valueHelper.isEmpty(result)) {
        log.result = result;
    }

    logger.error({ log });
};
