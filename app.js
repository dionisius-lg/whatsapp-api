const express = require('express');
const compression = require('compression');
const cron = require('node-cron');
const config = require('./src/config');
const router = require('./src/routes');
const logger = require('./src/helpers/logger');
const responseHelper = require('./src/helpers/response');
const scheduleTask = require('./src/helpers/schedule-task');

const { env, port } = config;
const { sendBadRequest } = responseHelper;
const app = express();

// compresses HTTP responses
app.use(compression());
// enable parsing json
app.use(express.json());
// enable parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// log all access
logger.access(app);
// override error syntax
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError) {
        logger.error({
            from: 'app',
            message: `Syntax error! ${req.method} ${req.path} ${err?.message}`
        });

        return sendBadRequest(res, err?.message || '');
    }

    next();
});
// define all route
app.use(router);
// disable x-powered-by
app.disable('x-powered-by');

// run service
app.listen(port, '0.0.0.0', (err) => {
    if (err) {
        console.error(err);
    }

    console.log(`[server] is running for ${env} environtment | port ${port}`);
});

// running schedule task every 2 minutes
let isResendFailedMesssageInbound = false;
cron.schedule('*/2 * * * *', async () => {
    if (isResendFailedMesssageInbound) {
        console.log('[schedule-task] resend failed message inbound to webhook is still running...');

        return false;
    }

    isResendFailedMesssageInbound = true;
    await scheduleTask.resendFailedMesssageInbound();
    isResendFailedMesssageInbound = false;
});

// running schedule task every 5 minutes
let isResendFailedMesssageNotif = false;
cron.schedule('*/5 * * * *', async () => {
    if (isResendFailedMesssageNotif) {
        console.log('[schedule-task] resend failed message notification to webhook is still running...');

        return false;
    }

    isResendFailedMesssageNotif = true;
    await scheduleTask.resendFailedMesssageNotif();
    isResendFailedMesssageNotif = false;
});

// running schedule task every 15 minutes
let isUpdateTemplateStatus = false;
cron.schedule('*/15 * * * *', async () => {
    if (isUpdateTemplateStatus) {
        console.log('[schedule-task] update template status from whatsapp is still running...');

        return false;
    }

    isUpdateTemplateStatus = true;
    await scheduleTask.updateTemplateStatus();
    isUpdateTemplateStatus = false;
});
