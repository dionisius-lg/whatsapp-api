const dateFormat = require('dateformat');
const whatsappApi = require('./whatsapp-api');
const webhookApi = require('./../helpers/webhook-api');
const appClientsModel = require('./../models/app-clients');
const messageNotificationsModel = require('./../models/message-notifications');
const messageTemplatesModel = require('./../models/message-templates');
const messagesModel = require('./../models/messages');

/**
 * Resend Failed Message Inbound to Webhook Client
 */
exports.resendFailedMesssageInbound = async () => {
    // const messages = await messagesModel.getAll({ sent: 'NULL', direction_id: 1 });
    // const appClients = await appClientsModel.getAll({ is_active: 1 });

    // // check messages & app client data from database
    // if (messages.total_data > 0 && appClients.total_data > 0) {
    //     // loop row message data
    //     for (let i in messages?.data) {
    //         let { id, content, sent_attempt } = messages.data[i];

    //         // we try to resend up to 3x include first try send, so we check sent attempt first
    //         if (sent_attempt >= 3) {
    //             continue;
    //         }

    //         let result = { success: 0, error: 0 };
    //         let messageData = { status_id: 5, sent_attempt: parseInt(sent_attempt) + 1 };
    //         let send = await webhookApi.send({ clients: appClients.data, body: content });

    //         if (send.success > 0) {
    //             messageData.status_id = 1;
    //             messageData.sent = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
    //         }

    //         await messagesModel.updateData(messageData, { id });

    //         result.success += send.success;
    //         result.error += send.error;

    //         console.log(`[schedule-task] resend failed message inbound to webhook done. ID: ${id}. Success: ${result.success}. Error: ${result.error}`);
    //     }
    // }
};

/**
 * Resend Failed Message Notification to Webhook Client
 */
exports.resendFailedMesssageNotif = async () => {
    // const messageNotifications = await messageNotificationsModel.getAll({ status_id: 5, sent: 'NULL' });
    // const appClients = await appClientsModel.getAll({ is_active: 1 });

    // // check message notifications & app client data from database
    // if (messageNotifications.total_data > 0 && appClients.total_data > 0) {
    //     // loop row message notifications data
    //     for (let i in messageNotifications?.data) {
    //         let { id, content, sent_attempt } = messageNotifications.data[i];

    //         // we try to resend up to 3x include first try send, so we check sent attempt first
    //         if (sent_attempt >= 3) {
    //             continue;
    //         }

    //         let result = { success: 0, error: 0 };
    //         let messageNotificationData = { status_id: 5, sent_attempt: parseInt(sent_attempt) + 1 };
    //         let send = await webhookApi.send({ clients: appClients.data, body: content });

    //         if (send.success > 0) {
    //             messageNotificationData.status_id = 1;
    //             messageNotificationData.sent = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
    //         }

    //         await messageNotificationsModel.updateData(messageNotificationData, { id });

    //         result.success += send.success;
    //         result.error += send.error;

    //         console.log(`[schedule-task] resend failed message notification to webhook done. ID: ${id}. Success: ${result.success}. Error: ${result.error}`);
    //     }
    // }
};

/**
 * Update Template Status from Whatsapp API
 */
exports.updateTemplateStatus = async () => {
    const messageTemplates = await messageTemplatesModel.getAll({ status_id: [9, 10] });

    // check message templates data from database
    if (messageTemplates?.total_data && messageTemplates.total_data > 0) {
        let result = { success: 0, error: 0 };

        for (let i in messageTemplates?.data) {
            let { template_id } = messageTemplates.data[i];
            let api = await whatsappApi.get(`/message-templates/${template_id}`);

            if ([200, 201].includes(api.status) && api.data?.status) {
                switch (true) {
                    case (typeof api.data?.status === 'string' && ['APPROVED'].includes((api.data.status).toUpperCase())):
                        let update1 = await messageTemplatesModel.updateData({ status_id: 6 }, { template_id });

                        if (update1.total_data > 0) {
                            result.success += 1;
                        } else {
                            result.error += 1;
                        }

                        break;
                    case (typeof api.data?.status === 'string' && ['REJECTED'].includes((api?.data?.status).toUpperCase())):
                        let update2 = await messageTemplatesModel.updateData({ status_id: 7 }, { template_id });

                        if (update2.total_data > 0) {
                            result.success += 1;
                        } else {
                            result.error += 1;
                        }

                        break;
                    case (typeof api.data?.status === 'string' && ['FLAGGED', 'REVISION'].includes((api?.data?.status).toUpperCase())):
                        let update3 = await messageTemplatesModel.updateData({ status_id: 8 }, { template_id });

                        if (update3.total_data > 0) {
                            result.success += 1;
                        } else {
                            result.error += 1;
                        }

                        break;
                    case (typeof api.data?.status === 'string' && ['PAUSED'].includes((api?.data?.status).toUpperCase())):
                        let update4 = await messageTemplatesModel.updateData({ status_id: 9 }, { template_id });

                        if (update4.total_data > 0) {
                            result.success += 1;
                        } else {
                            result.error += 1;
                        }

                        break;
                }
            }
        }

        console.log(`[schedule-task] update template status from whatsapp done. Success: ${result.success}. Error: ${result.error}`);
    }
};
