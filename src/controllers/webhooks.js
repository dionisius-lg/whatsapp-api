const dateFormat = require('dateformat');
const logger = require('./../helpers/logger');
const responseHelper = require('./../helpers/response');
const webhookApi = require('./../helpers/webhook-api');
const whatsappMediaApi = require('./../helpers/whatsapp-media-api');
const appClientsModel = require('./../models/app-clients');
const mediasModel = require('./../models/medias');
const messagesModel = require('./../models/messages');
const messageNotificationsModel = require('./../models/message-notifications');

/**
 * Receive Inbound From Webhook
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.inbound = async (req, res) => {
    const { body } = req;

    let messageNotificationData = {
        content: JSON.stringify(body),
        sent_attempt: 1
    };

    try {
        const { data } = await appClientsModel.getAll({ is_active: 1 });

        if (data) {
            const send = await webhookApi.send({ clients: data, body });

            switch (true) {
                case (send.success > 0):
                    await messageNotificationsModel.insertData({
                        ...messageNotificationData,
                        status_id: 1,
                        sent: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
                    });
                    break;
                default:
                    await messageNotificationsModel.insertData({
                        ...messageNotificationData,
                        status_id: 5
                    });
                    break;
            }
        } else {
            logger.error({
                from: 'webhooks:inbound',
                message: 'Send to webhook error! Client not found'
            });

            await messageNotificationsModel.insertData({ ...messageNotificationData, status_id: 5 });
        }

        return responseHelper.sendSuccess(res, body);
    } catch (err) {
        logger.error({
            from: 'webhooks:inbound',
            message: `Send to webhook error! ${err?.message}`,
            result: err
        });

        return responseHelper.sendInternalServerError(res);
    }
};

/**
 * Receive Inbound Status From Webhook
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.inboundStatus = async (req, res) => {
    const { body } = req;
    const { statuses } = body;
    const { id, status } = statuses[0];

    let messageNotificationData = {
        content: JSON.stringify(body),
        sent_attempt: 1
    };

    try {
        let status_id = 0;

        if (status && typeof status === 'string') {
            switch (true) {
                // case (['SENT'].includes(status.toUpperCase())):
                //     status_id = 1;
                //     break;
                case (['DELIVERED'].includes(status.toUpperCase())):
                    status_id = 2;
                    break;
                case (['READ'].includes(status.toUpperCase())):
                    status_id = 3;
                    break;
                case (['DELETED'].includes(status.toUpperCase())):
                    status_id = 4;
                    break;
                case (['FAILED'].includes(status.toUpperCase())):
                    status_id = 5;
                    break;
            }

            if (status_id > 0) {
                await messagesModel.updateData({ status_id }, { wa_message_id: id });
            }
        }

        const { data } = await appClientsModel.getAll({ is_active: 1 });

        if (data) {
            const send = await webhookApi.send({ clients: data, body });

            switch (true) {
                case (send.success > 0):
                    await messageNotificationsModel.insertData({
                        ...messageNotificationData,
                        status_id: 1,
                        sent: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
                    });
                    break;
                default:
                    await messageNotificationsModel.insertData({
                        ...messageNotificationData,
                        status_id: 5
                    });
                    break;
            }
        } else {
            logger.error({
                from: 'webhooks:inboundStatus',
                message: 'Send to webhook error! Client not found'
            });

            await messageNotificationsModel.insertData({ ...messageNotificationData, status_id: 5 });
        }

        return responseHelper.sendSuccess(res, body);
    } catch (err) {
        logger.error({
            from: 'webhooks:inboundStatus',
            message: `Send to webhook error! ${err?.message}`,
            result: err
        });

        return responseHelper.sendInternalServerError(res);
    }
};

/**
 * Receive Inbound Message From Webhook
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.inboundMessage = async (req, res) => {
    const { body } = req;
    const { contacts, messages } = body;
    const { wa_id } = contacts[0];
    const { type, id } = messages[0];

    let messageData = {
        type_id: 5,
        direction_id: 1,
        wa_id: wa_id,
        wa_message_id: id,
        content: JSON.stringify(body),
        sent_attempt: 1
    };

    try {
        switch (true) {
            case (type === 'contacts'):
                messageData.type_id = 1;
                break;
            case (type === 'location'):
                messageData.type_id = 2;
                break;
            case (['image', 'video', 'document', 'voice', 'audio', 'sticker'].includes(type)):
                messageData.type_id = 3;
                messageData.wa_media_id = messages[0][`${type}`].id;

                const mediaApi = await whatsappMediaApi.download({
                    id: messages[0][`${type}`].id,
                    mime_type: messages[0][`${type}`].mime_type,
                    caption: messages[0][`${type}`]?.caption || null
                });

                if ([200, 201].includes(mediaApi.status)) {
                    logger.success({
                        from: 'webhooks:inboundMessage',
                        message: `Download media ${messages[0][`${type}`].id} success!`,
                        result: mediaApi?.data || null
                    });

                    await mediasModel.insertUpdateData([{
                        wa_media_id: messages[0][`${type}`].id,
                        path: mediaApi.data.path,
                        file_name: mediaApi.data.file_name,
                        file_size: mediaApi.data.file_size,
                        mime_type: mediaApi.data?.mime_type || null
                    }]);
                } else {
                    logger.error({
                        from: 'webhooks:inboundMessage',
                        message: `Download media ${messages[0][`${type}`].id} error!`,
                        result: mediaApi?.data || null
                    });
                }

                break;
            default:
                messageData.type_id = 5;
                break;
        }

        const { data } = await appClientsModel.getAll({ is_active: 1 });

        if (data) {
            const send = await webhookApi.send({ clients: data, body });

            switch (true) {
                case (send.success > 0):
                    await messagesModel.insertData({
                        ...messageData,
                        status_id: 1,
                        sent: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
                    });
                    break;
                default:
                    await messagesModel.insertData({
                        ...messageData,
                        status_id: 5
                    });
                    break;
            }
        } else {
            logger.error({
                from: 'webhooks:inboundMessage',
                message: 'Send to webhook error! Client not found'
            });

            await messagesModel.insertData({ ...messageData, status_id: 5 });
        }

        return responseHelper.sendSuccess(res, body);
    } catch (err) {
        logger.error({
            from: 'webhooks:inboundMessage',
            message: `Send to webhook error! ${err?.message}`,
            result: err
        });

        return responseHelper.sendInternalServerError(res);
    }
};
