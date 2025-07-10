const express = require('express');
const compression = require('compression');
const cron = require('node-cron');
const config = require('./src/config');
const router = require('./src/routes');
const logger = require('./src/helpers/logger');
const responseHelper = require('./src/helpers/response');
const scheduleTask = require('./src/helpers/schedule-task');

const { env, port, schedule } = config;
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

// flag for resend failed message inbound
let isResendFailedMesssageInbound = false;
// flag for resend failed message notification
let isResendFailedMesssageNotif = false;
// flag for update template status
let isUpdateTemplateStatus = false;

if (schedule.service === 1) {
    cron.schedule(schedule.cron_resend_failed_inbound, async () => {
        if (isResendFailedMesssageInbound) {
            console.log('[schedule-task] resend failed message inbound to webhook is still running...');

            return false;
        }

        isResendFailedMesssageInbound = true;
        await scheduleTask.resendFailedMesssageInbound();
        isResendFailedMesssageInbound = false;
    });

    cron.schedule(schedule.cron_resend_failed_notification, async () => {
        if (isResendFailedMesssageNotif) {
            console.log('[schedule-task] resend failed message notification to webhook is still running...');

            return false;
        }

        isResendFailedMesssageNotif = true;
        await scheduleTask.resendFailedMesssageNotif();
        isResendFailedMesssageNotif = false;
    });

    cron.schedule(schedule.cron_update_template_status, async () => {
        if (isUpdateTemplateStatus) {
            console.log('[schedule-task] update template status from whatsapp is still running...');

            return false;
        }

        isUpdateTemplateStatus = true;
        await scheduleTask.updateTemplateStatus();
        isUpdateTemplateStatus = false;
    });
}