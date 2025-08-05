const dateFormat = require('dateformat');
const config = require('./../config');
const logger = require('./../helpers/logger');
const mediaHelper = require('./../helpers/media');
const responseHelper = require('./../helpers/response');
const valueHelper = require('./../helpers/value');
const whatsappApi = require('./../helpers/whatsapp-api');
const messagesModel = require('./../models/messages');
const ticketMediasModel = require('./../models/ticket-medias-cc');
const ticketsModel = require('./../models/tickets-cc');
const whatsappBroadcastsModel = require('./../models/whatsap-broadcasts-cc');
const whatsappCardsModel = require('./../models/whatsapp-cards-cc');
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

        const tickets = ticketsModel.getAll({
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

        const tickets = ticketsModel.getAll({
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

        const tickets = ticketsModel.getAll({
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

        const tickets = ticketsModel.getAll({
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

        const tickets = ticketsModel.getAll({
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
            const templateData = whatsappTemplate.data;

            let whatsappBroadcastData = {
                wa_template_id: templateData.id,
                waba_template_id: template_id,
                wa_import_id: 0,
                content: JSON.stringify(body),
                field: `${wa_id}`,
                media_status_id: 11,
                wa_id,
                media_id: 12,
                created_by: decoded?.user_id || 0
            };

            let contentBody = {};
            const requestComponents = body.components || [];

            if (!isEmpty(templateData.header_format) && !isEmpty(requestComponents)) {
                const parameterHeader = requestComponents.find((row) => row.type === 'header')?.parameters?.[0];

                if (!isEmpty(parameterHeader)) {
                    let templateDataheader = {
                        type: (parameterHeader.type?.toString() || '').toLowerCase()
                    };

                    switch (true) {
                        case ['document', 'image', 'video'].includes(templateDataheader.type):
                            templateDataheader[templateDataheader.type] = parameterHeader[templateDataheader.type];

                            if (templateDataheader.type === 'document' && !isEmpty(parameterHeader[templateDataheader.type]?.filename)) {
                                templateDataheader[templateDataheader.type].filename = parameterHeader[templateDataheader.type].filename;
                            }

                            break;
                        case ['text'].includes(templateDataheader.type):
                            templateDataheader.text = parameterHeader[templateDataheader.type];
                            break;
                    }

                    contentBody.header = templateDataheader;
                }
            }

            if (!isEmpty(templateData.body)) {
                let templateDataBody = templateData.body;
                const parameterBody = requestComponents.find((row) => row.type === 'body')?.parameters || [];

                if (!isEmpty(parameterBody)) {
                    for (let i in parameterBody) {
                        const value = parameterBody[i].text?.toString();

                        if (value !== undefined) {
                            whatsappBroadcastData.field += `,${value}`;
                            templateDataBody = templateDataBody.replace(new RegExp(`{{(${parseInt(i) + 1})}}`, 'g'), value);
                        }
                    }
                }

                contentBody.body = {
                    text: templateDataBody
                };
            }

            if (!isEmpty(templateData.footer)) {
                contentBody.footer = templateData.footer;
            }

            if (!isEmpty(templateData.button)) {
                const templateDataButton = jsonParse(templateData.button);
                let buttonData = [];

                if (templateDataButton?.web) {
                    buttonData.push({
                        type: templateDataButton.web.type,
                        text: templateDataButton.web.text,
                        url: templateDataButton.web.url
                    });
                }

                if (templateDataButton?.call) {
                    buttonData.push({
                        type: templateDataButton.call.type,
                        text: templateDataButton.call.text,
                        country_code: templateDataButton.call.country_code,
                        phone_number: templateDataButton.call.phone_number
                    });
                }

                if (!isEmpty(buttonData)) {
                    contentBody.buttons = buttonData;
                }
            }

            if (templateData.campaign_format_id === 2 && !isEmpty(requestComponents)) {
                const cards = await whatsappCardsModel.getAll({
                    wa_template_id: templateData.id,
                    is_active: 1
                });

                if (cards.total_data > 0) {
                    const requestCarouselCards = requestComponents.find((row) => row.type === 'carousel')?.cards || [];

                    const templateDataCards = cards.data.map((card, i) => {
                        let templateDataCard = {
                            header: card.header,
                            body: { text: card.body },
                            buttons: card.buttons
                        };

                        const cardComponents = requestCarouselCards.find((row) => Number(row.card_index) === i)?.components || [];
                        const parameterCardHeader = cardComponents.find((row) => row.type === 'header')?.parameters?.[0];

                        if (!isEmpty(parameterCardHeader)) {
                            templateDataCard.header = {
                                format: parameterCardHeader.type,
                                link: parameterCardHeader[parameterCardHeader.type].link
                            };
                        }

                        const cardComponentButtons = cardComponents.filter((row) => row.type === 'button') || [];

                        for (const cardComponentButton of cardComponentButtons) {
                            if (Array.isArray(templateDataCard.buttons)) {
                                const idxButtonQuickReply = templateDataCard.buttons.findIndex((row) => row.type === 'quick_reply');
                                const idxButtonUrl = templateDataCard.buttons.findIndex((row) => row.type === 'url');

                                if (cardComponentButton.sub_type === 'quick_reply' && idxButtonQuickReply >= 0) {
                                    templateDataCard.buttons[idxButtonQuickReply].text = cardComponentButton.parameters[0].payload;
                                }

                                if (cardComponentButton.sub_type === 'url' && idxButtonUrl >= 0) {
                                    templateDataCard.buttons[idxButtonUrl].text = cardComponentButton.parameters[0].text;
                                }
                            }
                        }

                        return templateDataCard;
                    });

                    contentBody.cards = templateDataCards;
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
    const { body, decoded } = req;
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

        const tickets = ticketsModel.getAll({
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

