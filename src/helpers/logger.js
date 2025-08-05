const dateFormat = require('dateformat');
const morgan = require('morgan');
const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const rfs = require('rotating-file-stream');
const path = require('path');
const valueHelper = require('./value');

const createMorganStream = (type = 'access') => {
    const dir = path.resolve('./', 'logs', type);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const filename = (time) => {
        return time ? `access-${dateFormat(time, 'yyyy-mm-dd')}.log.gz` : 'access.log';
    };

    const stream = rfs.createStream(filename, {
        interval: '1d',
        path: dir,
        compress: 'gzip',
        maxFiles: 90
    });

    stream.on('rotated', (filename) => {
        console.log(`[logger] Rotate ${type} log:`, filename);
    });

    stream.on('error', (err) => {
        console.log(`[logger] Stream ${type} log error:`, err);
    });

    return stream;
};

const cacheMorganStream = {};

const morganStream = (type = 'access') => {
    if (cacheMorganStream[type]) {
        return cacheMorganStream[type];
    }

    const stream = createMorganStream(type);
    cacheMorganStream[type] = stream;

    return stream;
};

const createWinstonLogger = (type = 'success') => {
    const logDir = path.resolve('./', 'logs', type);

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const transport = new winston.transports.DailyRotateFile({
        level: 'info',
        filename: path.resolve(logDir, `${type}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: 90,
        auditFile: path.resolve(logDir, `${type}-audit.json`)
    });

    transport.on('rotate', (oldFilename, newFilename) => {
        console.log(`[logger] Rotate ${type} log:`, oldFilename, 'to', newFilename);
    });

    transport.on('error', error => {
        console.log(`[logger] Stream ${type} log error:`, err);
    });

    const logger = winston.createLogger({
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf((info) => {
                let logData = {
                    status: type,
                    from: info.from,
                    message: info.message
                };

                if (!valueHelper.isEmpty(info.result)) {
                    logData.result = info.result;
                }

                return `${info.timestamp} ${JSON.stringify(logData)}`;
            })
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
    const stream = morganStream('access');

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

    app.use(morgan(':remote-addr :remote-user [:date] :status [secret=:secret] ":method :url HTTP/:http-version" :body :response-time ms - :res[content-length] ', { stream }));
};

exports.success = ({ from = 'server', message = '', result = null }) => {
    const logger = winstonLogger('success');
    let log = { from, message, result };

    logger.info(log);
};

exports.error = ({ from = 'server', message = '', result = null }) => {
    const logger = winstonLogger('error');
    let log = { from, message, result };

    logger.error(log);
};
