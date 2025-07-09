const dateFormat = require('dateformat');
const morgan = require('morgan');
const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const rfs = require('rotating-file-stream');
const path = require('path');
const valueHelper = require('./value');

exports.access = (app) => {
    const logPath = path.resolve('./', 'logs/access');

    if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
    }

    const logName = (time) => {
        if (time) {
            return ['access', dateFormat(time, 'yyyy-mm-dd'), '.log'].join('-');
        }

        return 'access.log';
    };

    const logStream = rfs.createStream(logName, {
        interval: '1d', // rotate daily
        path: logPath, // log path
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
        return dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
    });

    morgan.token('secret', (req) => {
        return req.headers && req.headers['x-api-key'];
    });

    app.use(morgan(':remote-addr :remote-user [:date] :status [secret=:secret] ":method :url HTTP/:http-version" :body :response-time ms - :res[content-length] ', { stream: logStream }));
};

exports.success = ({ from = 'server', message = '', result = null }) => {
    const logPath = path.resolve('./', 'logs/success');

    if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
    }

    const transport = new winston.transports.DailyRotateFile({
        filename: path.resolve(logPath, 'success-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: (3 * 31).toString() + 'd',
        auditFile: path.resolve(logPath, 'audit.json')
    });

    transport.on('rotate', (oldFile, newFile) => {
        console.log(`Rotate log: ${oldFile} to ${newFile}`);
    });

    const logger = winston.createLogger({
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf((info) => `${info.timestamp} ${JSON.stringify(info.message.log)}`)
        ),
        transports: [new winston.transports.Console(), transport]
    });

    let log = { status: 'success', from, message };

    if (!valueHelper.isEmpty(result)) {
        log.result = result;
    }

    return logger.info({ log });
};

exports.error = ({ from = 'server', message = '', result = null }) => {
    const logPath = path.resolve('./', 'logs/error');

    if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
    }

    const transport = new winston.transports.DailyRotateFile({
        filename: path.resolve(logPath, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: (3 * 31).toString() + 'd',
        auditFile: path.resolve(logPath, 'audit.json')
    });

    transport.on('rotate', (oldFile, newFile) => {
        console.log(`Rotate log: ${oldFile} to ${newFile}`);
    });

    const logger = winston.createLogger({
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf((info) => `${info.timestamp} ${JSON.stringify(info.message.log)}`)
        ),
        transports: [new winston.transports.Console(), transport]
    });

    let log = { status: 'error', from, message };

    if (!valueHelper.isEmpty(result)) {
        log.result = result;
    }

    return logger.error({ log });
};
