const dateFormat = require('dateformat');
const config = require('./../config');
const logger = require('./../helpers/logger');
const mediaHelper = require('./../helpers/media');
const responseHelper = require('./../helpers/response');
const valueHelper = require('./../helpers/value');
const whatsappApi = require('./../helpers/whatsapp-api');
const messagesModel = require('./../models/messages');
const ticketMediasModel = require('./../models/ticket-medias-cc');
const ticketModel = require('./../models/tickets-cc');
const whatsappBroadcastsModel = require('./../models/whatsap-broadcasts-cc');
const whatsappTemplatesModel = require('./../models/whatsapp-templates-cc');
const whatsappsModel = require('./../models/whatsapps-cc');

const { whatsapp: { bsp } } = config;
const { isEmpty, jsonParse } = valueHelper;

/**
 * Send Contact Message
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.sendContact = async (req, res) => {
    const { body, decoded } = req;
    const { wa_id } = body;

    let messageData = {
        type_id: 1,
        direction_id: 2,
        wa_id: wa_id,
        content: JSON.stringify(body),
        sent_attempt: 1
    };

    try {
        let whatsappData = {
            waba_id: wa_id,
            media_status_id: 11,
            direction_id: 2,
            wa_to: wa_id,
            type: 'contacts',
            content: body.contacts.map((row) => `Name: ${row.name.formatted_name}\nPhone: ${row.phones[0].phone}`).join('\n\n'),
            waba_timestamp: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            created_by: decoded?.user_id || 0,
            sender: 2
        };

        let { contacts, ...data } = body;

        if (!isEmpty(contacts)) {
            if (bsp === 'JSM') {
                const modifiedContacts = contacts.reduce((acc, row) => {
                    const { name: { formatted_name } } = row;
                    row.name.first_name = (formatted_name).split(' ')[0];
                    acc.push(row);

                    return acc;
                }, []);

                contacts = modifiedContacts;
            }

            data.contacts = contacts;
        }

        const api = await whatsappApi.post('/messages/send-contact-message', data);

        if (![200, 201].includes(api.status)) {
            let message = 'Invalid request';

            if (api?.data?.message) {
                message = typeof api.data.message === 'string' ? api.data.message : api.data.message?.details || 'Invalid request';
            }

            if (api?.data?.errors) {
                message = api.data.errors;
            }

            throw new Error(message, { cause: api?.data || null });
        }

        const wa_message_id = api?.data?.messages[0]?.id || null;

        await messagesModel.insertData({
            ...messageData,
            status_id: 1,
            sent: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            wa_message_id
        });

        const tickets = ticketModel.getAll({
            contact: wa_id,
            media_id: 4,
            limit: 1,
            sort: 'desc'
        });

        if (tickets.total_data > 0) {
            const insertWhatsapp = await whatsappsModel.insertData({
                ...whatsappData,
                waba_message_id: wa_message_id
            });

            if (insertWhatsapp.total_data > 0) {
                await ticketMediasModel.insertData({
                    ticket_id: tickets[0].data.id,
                    media_id: 4,
                    direction_id: 2,
                    record_id: insertWhatsapp.data.id
                });
            }
        }

        logger.success({
            from: 'messages:sendContact',
            message: `Send contact message to ${wa_id} success`,
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'messages:sendContact',
            message: `Send contact message to ${wa_id} error! ${err?.message}`,
            result: err?.cause || null
        });

        await messagesModel.insertData({ ...messageData, status_id: 5 });

        return responseHelper.sendBadRequest(res, err?.message || `Send contact message to ${wa_id} error!`);
    }
};

/**
 * Send Location Message
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.sendLocation = async (req, res) => {
    const { body, decoded } = req;
    const { wa_id } = body;

    let messageData = {
        type_id: 2,
        direction_id: 2,
        wa_id,
        content: JSON.stringify(body),
        sent_attempt: 1
    };

    try {
        let whatsappData = {
            waba_id: wa_id,
            media_status_id: 11,
            direction_id: 2,
            wa_to: wa_id,
            type: 'location',
            content: `https://maps.google.com/maps/search/${body.latitude},${body.longitude}`,
            waba_timestamp: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            created_by: decoded?.user_id || 0,
            sender: 2
        };

        let data = body;

        if (isEmpty(data.name)) {
            data.name = `${data.latitude}, ${data.longitude}`;
        }

        if (isEmpty(data.address)) {
            data.address = `https://maps.google.com/maps/search/${data.latitude},${data.longitude}`;
        }

        const api = await whatsappApi.post('/messages/send-location-message', data);

        if (![200, 201].includes(api.status)) {
            let message = 'Invalid request';

            if (api?.data?.message) {
                message = typeof api.data.message === 'string' ? api.data.message : api.data.message?.details || 'Invalid request';
            }

            if (api?.data?.errors) {
                message = api.data.errors;
            }

            throw new Error(message, { cause: api?.data || null });
        }

        const wa_message_id = api?.data?.messages[0]?.id;

        await messagesModel.insertData({
            ...messageData,
            status_id: 1,
            sent: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            wa_message_id
        });

        const tickets = ticketModel.getAll({
            contact: wa_id,
            media_id: 4,
            limit: 1,
            sort: 'desc'
        });

        if (tickets.total_data > 0) {
            const insertWhatsapp = await whatsappsModel.insertData({
                ...whatsappData,
                waba_message_id: wa_message_id
            });

            if (insertWhatsapp.total_data > 0) {
                await ticketMediasModel.insertData({
                    ticket_id: tickets[0].data.id,
                    media_id: 4,
                    direction_id: 2,
                    record_id: insertWhatsapp.data.id
                });
            }
        }

        logger.success({
            from: 'messages:sendLocation',
            message: `Send location message to ${wa_id} success`,
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'messages:sendContact',
            message: `Send location message to ${wa_id} error! ${err?.message}`,
            result: err?.cause || null
        });

        await messagesModel.insertData({ ...messageData, status_id: 5 });

        return responseHelper.sendBadRequest(res, err?.message || `Send location message to ${wa_id} error!`);
    }
};

/**
 * Send Media Message
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.sendMedia = async (req, res) => {
    const { body, decoded } = req;
    const { wa_id } = body;

    let messageData = {
        type_id: 3,
        direction_id: 2,
        wa_id: wa_id,
        content: JSON.stringify(body),
        sent_attempt: 1
    };

    try {
        let whatsappData = {
            waba_id: wa_id,
            media_status_id: 11,
            direction_id: 2,
            wa_to: wa_id,
            type: body.type,
            mime_type: mediaHelper.getMimeType(body.link),
            caption: body?.caption || null,
            content: body?.caption || null,
            waba_timestamp: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            created_by: decoded?.user_id || 0,
            sender: 2
        };

        const api = await whatsappApi.post('/messages/send-media-message', body);

        if (![200, 201].includes(api.status)) {
            let message = 'Invalid request';

            if (api?.data?.message) {
                message = typeof api.data.message === 'string' ? api.data.message : api.data.message?.details || 'Invalid request';
            }

            if (api?.data?.errors) {
                message = api.data.errors;
            }

            throw new Error(message, { cause: api?.data || null });
        }

        const wa_message_id = api?.data?.messages[0]?.id;

        await messagesModel.insertData({
            ...messageData,
            status_id: 1,
            sent: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            wa_message_id
        });

        const tickets = ticketModel.getAll({
            contact: wa_id,
            media_id: 4,
            limit: 1,
            sort: 'desc'
        });

        if (tickets.total_data > 0) {
            const insertWhatsapp = await whatsappsModel.insertData({
                ...whatsappData,
                waba_message_id: wa_message_id
            });

            if (insertWhatsapp.total_data > 0) {
                await ticketMediasModel.insertData({
                    ticket_id: tickets[0].data.id,
                    media_id: 4,
                    direction_id: 2,
                    record_id: insertWhatsapp.data.id
                });
            }
        }

        logger.success({
            from: 'messages:sendMedia',
            message: `Send media message to ${wa_id} success`,
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'messages:sendMedia',
            message: `Send media message to ${wa_id} error! ${err?.message}`,
            result: err?.cause || null
        });

        await messagesModel.insertData({ ...messageData, status_id: 5 });

        return responseHelper.sendBadRequest(res, err?.message || `Send media message to ${wa_id} error!`);
    }
};

/**
 * Send Reply Button Message
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.sendReplyButton = async (req, res) => {
    const { body, decoded } = req;
    const { wa_id } = body;

    let messageData = {
        type_id: 6,
        direction_id: 2,
        wa_id: wa_id,
        content: JSON.stringify(body),
        sent_attempt: 1
    };

    try {
        let whatsappData = {
            waba_id: wa_id,
            media_status_id: 11,
            direction_id: 2,
            wa_to: wa_id,
            type: 'button',
            content: JSON.stringify(body),
            waba_timestamp: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            created_by: decoded?.user_id || 0,
            sender: 2
        };

        let data = body;

        if (bsp === 'JSM') {
            if (!isEmpty(data.header)) {
                const { header: { type, link } } = data;

                if (type !== 'text') {
                    data.header = {
                        type,
                        [type]: { link }
                    };
                }
            }

            if (!isEmpty(data.action)) {
                const { action: { buttons } } = data;

                const modifiedButtons = buttons.reduce((acc, row) => {
                    acc.push({
                        type: 'reply',
                        reply: row
                    });

                    return acc;
                }, []);

                data.action.buttons = modifiedButtons;

                let whatsappDataContent = JSON.parse(whatsappData.content);

                whatsappDataContent.action = { options: buttons };
                whatsappData.content = JSON.stringify(whatsappDataContent);
            }
        }

        const api = await whatsappApi.post('/messages/send-reply-button-message', data);

        if (![200, 201].includes(api.status)) {
            let message = 'Invalid request';

            if (api?.data?.message) {
                message = typeof api.data.message === 'string' ? api.data.message : api.data.message?.details || 'Invalid request';
            }

            if (api?.data?.errors) {
                message = api.data.errors;
            }

            throw new Error(message, { cause: api?.data || null });
        }

        const wa_message_id = api?.data?.messages[0]?.id;

        await messagesModel.insertData({
            ...messageData,
            status_id: 1,
            sent: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            wa_message_id
        });

        const tickets = ticketModel.getAll({
            contact: wa_id,
            media_id: 4,
            limit: 1,
            sort: 'desc'
        });

        if (tickets.total_data > 0) {
            const insertWhatsapp = await whatsappsModel.insertData({
                ...whatsappData,
                waba_message_id: wa_message_id
            });

            if (insertWhatsapp.total_data > 0) {
                await ticketMediasModel.insertData({
                    ticket_id: tickets[0].data.id,
                    media_id: 4,
                    direction_id: 2,
                    record_id: insertWhatsapp.data.id
                });
            }
        }

        logger.success({
            from: 'messages:sendReplyButton',
            message: `Send reply button message to ${wa_id} success`,
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'messages:sendReplyButton',
            message: `Send reply button message to ${wa_id} error! ${err?.message}`,
            result: err?.cause || null
        });

        await messagesModel.insertData({ ...messageData, status_id: 5 });

        return responseHelper.sendBadRequest(res, err?.message || `Send reply button message to ${wa_id} error!`);
    }
};

/**
 * Send Reply List Message
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.sendReplyList = async (req, res) => {
    const { body, decoded } = req;
    const { wa_id } = body;

    let messageData = {
        type_id: 7,
        direction_id: 2,
        wa_id: wa_id,
        content: JSON.stringify(body),
        sent_attempt: 1
    };

    try {
        let whatsappData = {
            waba_id: wa_id,
            media_status_id: 11,
            direction_id: 2,
            wa_to: wa_id,
            type: 'list',
            content: JSON.stringify(body),
            waba_timestamp: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            created_by: decoded?.user_id || 0,
            sender: 2
        };

        if (!isEmpty(body.action)) {
            const { action: { button, sections } } = data;

            let whatsappDataContent = JSON.parse(whatsappData.content);

            whatsappDataContent.action = {
                label: button,
                options: sections
            };

            whatsappData.content = JSON.stringify(whatsappDataContent);
        }

        const api = await whatsappApi.post('/messages/send-list-message', body);

        if (![200, 201].includes(api.status)) {
            let message = 'Invalid request';

            if (api?.data?.message) {
                message = typeof api.data.message === 'string' ? api.data.message : api.data.message?.details || 'Invalid request';
            }

            if (api?.data?.errors) {
                message = api.data.errors;
            }

            throw new Error(message, { cause: api?.data || null });
        }

        const wa_message_id = api?.data?.messages[0]?.id;

        await messagesModel.insertData({
            ...messageData,
            status_id: 1,
            sent: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            wa_message_id
        });

        const tickets = ticketModel.getAll({
            contact: wa_id,
            media_id: 4,
            limit: 1,
            sort: 'desc'
        });

        if (tickets.total_data > 0) {
            const insertWhatsapp = await whatsappsModel.insertData({
                ...whatsappData,
                waba_message_id: wa_message_id
            });

            if (insertWhatsapp.total_data > 0) {
                await ticketMediasModel.insertData({
                    ticket_id: tickets[0].data.id,
                    media_id: 4,
                    direction_id: 2,
                    record_id: insertWhatsapp.data.id
                });
            }
        }

        logger.success({
            from: 'messages:sendReplyList',
            message: `Send reply list message to ${wa_id} success`,
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'messages:sendReplyList',
            message: `Send reply list message to ${wa_id} error! ${err?.message}`,
            result: err?.cause || null
        });

        await messagesModel.insertData({ ...messageData, status_id: 5 });

        return responseHelper.sendBadRequest(res, err?.message || `Send reply list message to ${wa_id} error!`);
    }
};

/**
 * Send Template Message
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.sendTemplate = async (req, res) => {
    const { body, decoded } = req;
    const { wa_id, template_id } = body;

    let messageData = {
        type_id: 4,
        direction_id: 2,
        wa_id: wa_id,
        wa_template_id: template_id,
        content: JSON.stringify(body),
        sent_attempt: 1
    };

    try {
        const api = await whatsappApi.post('/messages/send-template-message', body);

        if (![200, 201].includes(api.status)) {
            let message = 'Invalid request';

            if (api?.data?.message) {
                message = typeof api.data.message === 'string' ? api.data.message : api.data.message?.details || 'Invalid request';
            }

            if (api?.data?.errors) {
                message = api.data.errors;
            }

            throw new Error(message, { cause: api?.data || null });
        }

        const wa_message_id = api?.data?.messages[0]?.id;

        await messagesModel.insertData({
            ...messageData,
            status_id: 1,
            sent: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            wa_message_id
        });

        const whatsappTemplate = await whatsappTemplatesModel.getDetail({
            template_id,
            with_header: 1,
            with_body: 1,
            with_footer: 1,
            with_button: 1
        });

        if (whatsappTemplate.total_data > 0) {
            let whatsappBroadcastData = {
                wa_template_id: whatsappTemplate.data.id,
                waba_template_id: template_id,
                wa_import_id: 0,
                content: JSON.stringify(content),
                field: `${wa_id}`,
                media_status_id: 11,
                wa_id,
                media_id: 12,
                created_by: decoded?.user_id || 0
            };

            let contentBody = {};

            if (!isEmpty(whatsappTemplate.data.header_format) && !isEmpty(whatsappTemplate.data.header_body)) {
                let whatsappTemplateDataHeader = {
                    type: (whatsappTemplate.data.header_format?.toString() || '').toLowerCase()
                };

                switch (true) {
                    case ['document', 'image', 'video'].includes(whatsappTemplateDataHeader.type):
                        whatsappTemplateDataHeader[whatsappTemplateDataHeader.type] = {
                            link: whatsappTemplate.data.header_body
                        };

                        if (whatsappTemplateDataHeader.type === 'document') {
                            whatsappTemplateDataHeader[whatsappTemplateDataHeader.type].filename = whatsappTemplate.data.file_name;
                        }

                        break;
                    case ['text'].includes(whatsappTemplateDataHeader.type):
                        whatsappTemplateDataHeader.text = whatsappTemplate.data.header_body;
                        break;
                }

                contentBody.header = whatsappTemplateDataHeader;
            }

            if (!isEmpty(whatsappTemplate.data.body)) {
                let whatsappTemplateDataBody = whatsappTemplate.data.body;

                if (!isEmpty(body.components)) {
                    const parameterBody = body.components.find((row) => row.type === 'body')?.parameters || [];

                    if (!isEmpty(parameterBody)) {
                        for (let i in parameterBody) {
                            let value = parameterBody[i].text.toString();

                            whatsappBroadcastData.field += `,${value}`;
                            whatsappTemplateDataBody = whatsappTemplateDataBody.replace(new RegExp(`{{(${parseInt(i) + 1})}}`, 'g'), value);
                        }
                    }
                }

                contentBody.body = {
                    text: whatsappTemplateDataBody
                };
            }

            if (!isEmpty(whatsappTemplate.data.footer)) {
                contentBody.footer = whatsappTemplate.data.footer;
            }

            if (!isEmpty(whatsappTemplate.data.button)) {
                const whatsappTemplateDataButton = jsonParse(whatsappTemplate.data.button);
                let buttonData = [];

                if (whatsappTemplateDataButton?.web) {
                    buttonData.push({
                        type: whatsappTemplateDataButton.web.type,
                        text: whatsappTemplateDataButton.web.text,
                        url: whatsappTemplateDataButton.web.url
                    });
                }

                if (whatsappTemplateDataButton?.call) {
                    buttonData.push({
                        type: whatsappTemplateDataButton.call.type,
                        text: whatsappTemplateDataButton.call.text,
                        country_code: whatsappTemplateDataButton.call.country_code,
                        phone_number: whatsappTemplateDataButton.call.phone_number
                    });
                }

                if (!isEmpty(buttonData)) {
                    contentBody.buttons = buttonData;
                }
            }

            if (!isEmpty(contentBody)) {
                whatsappBroadcastData.content_body = JSON.stringify(contentBody);
            }

            await whatsappBroadcastsModel.insertData(whatsappBroadcastData);
        }

        logger.success({
            from: 'messages:sendTemplate',
            message: `Send template message to ${wa_id} success`,
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'messages:sendTemplate',
            message: `Send template message to ${wa_id} error! ${err?.message}`,
            result: err?.cause || null
        });

        await messagesModel.insertData({ ...messageData, status_id: 5 });

        return responseHelper.sendBadRequest(res, err?.message || `Send template message to ${wa_id} error!`);
    }
};

/**
 * Send Text Message
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.sendText = async (req, res) => {
    const { body } = req;
    const { wa_id } = body;

    let messageData = {
        type_id: 5,
        direction_id: 2,
        wa_id: wa_id,
        content: JSON.stringify(body),
        sent_attempt: 1
    };

    try {
        let whatsappData = {
            waba_id: wa_id,
            media_status_id: 11,
            direction_id: 2,
            wa_to: wa_id,
            type: 'text',
            content: body.text,
            waba_timestamp: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            created_by: decoded?.user_id || 0,
            sender: 2
        };

        const api = await whatsappApi.post('/messages/send-text-message', body);

        if (![200, 201].includes(api.status)) {
            let message = 'Invalid request';

            if (api?.data?.message) {
                message = typeof api.data.message === 'string' ? api.data.message : api.data.message?.details || 'Invalid request';
            }

            if (api?.data?.errors) {
                message = api.data.errors;
            }

            throw new Error(message, { cause: api?.data || null });
        }

        const wa_message_id = api?.data?.messages[0]?.id;

        await messagesModel.insertData({
            ...messageData,
            status_id: 1,
            sent: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            wa_message_id
        });

        const tickets = ticketModel.getAll({
            contact: wa_id,
            media_id: 4,
            limit: 1,
            sort: 'desc'
        });

        if (tickets.total_data > 0) {
            const insertWhatsapp = await whatsappsModel.insertData({
                ...whatsappData,
                waba_message_id: wa_message_id
            });

            if (insertWhatsapp.total_data > 0) {
                await ticketMediasModel.insertData({
                    ticket_id: tickets[0].data.id,
                    media_id: 4,
                    direction_id: 2,
                    record_id: insertWhatsapp.data.id
                });
            }
        }

        logger.success({
            from: 'messages:sendText',
            message: `Send text message to ${wa_id} success`,
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'messages:sendText',
            message: `Send text message to ${wa_id} error! ${err?.message}`,
            result: err?.cause || null
        });

        await messagesModel.insertData({ ...messageData, status_id: 5 });

        return responseHelper.sendBadRequest(res, err?.message || `Send text message to ${wa_id} error!`);
    }
};

