const config = require('./../config');
const logger = require('./../helpers/logger');
const responseHelper = require('./../helpers/response');
const valueHelper = require('./../helpers/value');
const whatsappApi = require('./../helpers/whatsapp-api');
const messageTemplatesModel = require('./../models/message-templates');
const whatsappFieldsModel = require('./../models/whatsapp-fields-cc');
const whatsappTemplatesModel = require('./../models/whatsapp-templates-cc');

const { whatsapp: { bsp } } = config;
const { isEmpty } = valueHelper;

/**
 * Fetch Message Template
 * @param {Request} req
 * @param {Response} res
 * @returns {Object} - response result
 */
exports.fetchTemplate = async (req, res) => {
    const { params: { id } } = req;

    try {
        let endpoint = 'message-templates';

        if (id) {
            endpoint += `/${id}`;
        }

        const api = await whatsappApi.get(endpoint);

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

        logger.success({
            from: 'message-templates:fetchTemplate',
            message: 'Fetch template success!',
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'message-templates:fetchTemplate',
            message: `Fetch template error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Fetch template error!');
    }
};

/**
 * Create Message Template
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.createTemplate = async (req, res) => {
    const { body, decoded } = req;

    try {
        let { buttons, ...data } = body;

        if (!isEmpty(buttons)) {
            if (bsp === 'JSM') {
                for (let i in buttons) {
                    if (buttons[i].type === 'PHONE_NUMBER' && buttons[i]?.country_code) {
                        buttons[i].phone_number = `${buttons[i].country_code}${buttons[i].phone_number}`;
                        delete buttons[i].country_code;
                    }
                }
            }

            data.buttons = buttons;
        }

        if (bsp !== 'JSM') {
            delete data.allow_category_change;
        }

        const api = await whatsappApi.post('/message-templates', data);

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

        let messageTemplateData = {
            ...data,
            header: !isEmpty(data.header) ? JSON.stringify(data.header) : null,
            body: !isEmpty(data.body) ? JSON.stringify(data.body) : null,
            buttons: !isEmpty(data.buttons) ? JSON.stringify(data.buttons) : null
        };

        let whatsappTemplateData = {
            label: data.label,
            waba_template_id: api.data.messages.id,
            template_id: api.data.messages.id,
            language_id: data.language_id,
            campaign_format_id: 1,
            body: data.body.text.toString(),
            is_propose: data.is_propose === true ? 1 : 0,
            created_by: decoded?.user_id || 0
        };

        if (api?.data?.messages?.status && typeof api.data.messages.status === 'string') {
            switch (true) {
                case (['APPROVED'].includes((api.data.messages.status).toUpperCase())):
                    messageTemplateData.status_id = 6;
                    whatsappTemplateData.campaign_status_id = 4;
                    break;
                case (['REJECTED'].includes((api.data.messages.status).toUpperCase())):
                    messageTemplateData.status_id = 7;
                    whatsappTemplateData.campaign_status_id = 5;
                    break;
                case (['FLAGGED', 'REVISION'].includes((api.data.messages.status).toUpperCase())):
                    messageTemplateData.status_id = 8;
                    whatsappTemplateData.campaign_status_id = 6;
                    break;
                case (['PAUSED'].includes((api.data.messages.status).toUpperCase())):
                    messageTemplateData.status_id = 9;
                    whatsappTemplateData.campaign_status_id = 7;
                    break;
                default:
                    messageTemplateData.status_id = messageTemplateData.is_propose ? 10 : 11;
                    whatsappTemplateData.campaign_status_id = messageTemplateData.is_propose ? 7 : 2;
                    break;
            }

            whatsappTemplateData.status = (api.data.messages.status).toLowerCase();
        }

        if (messageTemplateData.hasOwnProperty('allow_category_change')) {
            delete data.allow_category_change;
        }

        if (!isEmpty(data.header)) {
            let whatsappTemplateDataHeader = {
                format: data.header.format.toLowerCase()
            };

            switch (true) {
                case ['document', 'image', 'video'].includes(whatsappTemplateDataHeader):
                    whatsappTemplateDataHeader.body = !isEmpty(data.examples) ? data.examples[0].toString() : '';

                    if (!isEmpty(data.filename)) {
                        whatsappTemplateDataHeader.filename = data.filename;
                    }

                    break;
                default:
                    whatsappTemplateDataHeader.body = data.text;
                    break;
            }

            whatsappTemplateData.header = JSON.stringify(whatsappTemplateDataHeader);
        }

        if (!isEmpty(data.footer)) {
            whatsappTemplateData.footer = data.footer;
        }

        if (!isEmpty(data.buttons)) {
            let whatsappTemplateDataButton = {};

            const buttonCall = data.buttons.find((row) => row.type.toLowerCase() === 'phone_number') || null;
            const buttonWeb = data.buttons.find((row) => row.type.toLowerCase() === 'url') || null;

            if (!isEmpty(buttonCall)) {
                whatsappTemplateDataButton.call = buttonCall;
            }

            if (!isEmpty(buttonWeb)) {
                whatsappTemplateDataButton.web = buttonWeb;
            }

            if (!isEmpty(whatsappTemplateDataButton)) {
                whatsappTemplateData.button = JSON.stringify(JSON.stringify(whatsappTemplateDataButton));
            }
        }

        await messageTemplatesModel.insertData({
            ...messageTemplateData,
            template_id: api.data.messages.id
        });

        const insertWhatsappTemplate = await whatsappTemplatesModel.insertData(whatsappTemplateData);

        if (insertWhatsappTemplate.data && !isEmpty(data.body.examples)) {
            let whatsappFieldData = [];

            for (let i in data.body.examples) {
                whatsappFieldData.push({
                    wa_tempate_id: insertWhatsappTemplate.data.id,
                    field_name: data.body.examples[i],
                    field_id: parseInt(i) + 1,
                    field_code: `{{${parseInt(i) + 1}}}`,
                    import_template_id: 0
                });
            }

            await whatsappFieldsModel.insertManyData(whatsappFieldData);
        }

        logger.success({
            from: 'message-templates:createTemplate',
            message: `Create template success! ID ${api.data.messages.id}`,
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'templates:createTemplate',
            message: `Create template error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Create template error!');
    }
};

/**
 * Update Message Template By ID
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.updateTemplate = async (req, res) => {
    const { body, params: { id } } = req;

    try {
        let { buttons, ...data } = body;

        if (!isEmpty(buttons)) {
            if (bsp === 'JSM') {
                for (let i in buttons) {
                    if (buttons[i].type === 'PHONE_NUMBER' && buttons[i]?.country_code) {
                        buttons[i].phone_number = `${buttons[i].country_code}${buttons[i].phone_number}`;
                        delete buttons[i].country_code;
                    }
                }
            }

            data.buttons = buttons;
        }

        const api = bsp === 'JSM' ? await whatsappApi.post(`/message-templates/${id}`, data) : await whatsappApi.put(`/message-templates/${id}`, data);

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

        const whatsappTemplate = await whatsappTemplatesModel.getDetail({
            template_id: id
        });

        let messageTemplateData = data;
        let whatsappTemplateData = data;

        if (!isEmpty(data.category_id)) {
            switch (data.category_id) {
                case 'MARKETING':
                    whatsappTemplateData.campaign_category_id = 2;
                    break;
                case 'UTILITY':
                    whatsappTemplateData.campaign_category_id = 4;
                    break;
            }
        }

        if (data.hasOwnProperty('is_propose')) {
            whatsappTemplateData.is_propose = data.is_propose === true ? 1 : 0;
        }

        if (!isEmpty(data.header)) {
            messageTemplateData.header = JSON.stringify(data.header);

            let whatsappTemplateDataHeader = {
                format: data.header.format.toLowerCase()
            };

            switch (true) {
                case ['document', 'image', 'video'].includes(whatsappTemplateDataHeader):
                    whatsappTemplateDataHeader.body = !isEmpty(data.examples) ? data.examples[0].toString() : '';

                    if (!isEmpty(data.filename)) {
                        whatsappTemplateDataHeader.filename = data.filename;
                    }

                    break;
                default:
                    whatsappTemplateDataHeader.body = data.text;
                    break;
            }

            whatsappTemplateData.header = JSON.stringify(whatsappTemplateDataHeader);
        }

        if (!isEmpty(data.body)) {
            messageTemplateData.body = JSON.stringify(data.body);
            whatsappTemplateData.body = data.body.text;
        }

        if (!isEmpty(data.buttons)) {
            messageTemplateData.buttons = JSON.stringify(data.buttons);

            let whatsappTemplateDataButton = {};

            const buttonCall = data.buttons.find((row) => row.type.toLowerCase() === 'phone_number') || null;
            const buttonWeb = data.buttons.find((row) => row.type.toLowerCase() === 'url') || null;

            if (!isEmpty(buttonCall)) {
                whatsappTemplateDataButton.call = buttonCall;
            }

            if (!isEmpty(buttonWeb)) {
                whatsappTemplateDataButton.web = buttonWeb;
            }

            if (!isEmpty(whatsappTemplateDataButton)) {
                whatsappTemplateData.button = JSON.stringify(JSON.stringify(whatsappTemplateDataButton));
            }

            delete whatsappTemplateData.buttons;
        }

        await messageTemplatesModel.updateData(messageTemplateData, { template_id: id });

        if (whatsappTemplate.total_data > 0) {
            await whatsappTemplatesModel.updateData(whatsappTemplateData, {
                id: whatsappTemplate.data.id
            });

            if (data.body.examples) {
                await whatsappFieldsModel.updateData({ is_active: 0 }, { wa_tempate_id: whatsappTemplate.data.id });

                if (!isEmpty(data.body.examples)) {
                    let whatsappFieldData = [];

                    for (let i in data.body.examples) {
                        whatsappFieldData.push({
                            wa_tempate_id: whatsappTemplate.data.id,
                            field_name: data.body.examples[i],
                            field_id: parseInt(i) + 1,
                            field_code: `{{${parseInt(i) + 1}}}`,
                            import_template_id: 0
                        });
                    }

                    await whatsappFieldsModel.insertManyData(whatsappFieldData);
                }
            }
        }

        logger.success({
            from: 'message-templates:updateTemplate',
            message: `Update template success! ID ${id}`,
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'templates:updateTemplate',
            message: `Update template error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Update template error!');
    }
};

/**
 * Propose Message Template
 * @param {Request} req
 * @param {Response} res
 * @returns response
 */
exports.proposeTemplate = async (req, res) => {
    const { params: { id } } = req;

    try {
        if (bsp !== 'JSM') {
            throw new Error('This action is not supported');
        }

        const api = await whatsappApi.post(`/message-templates/${id}/propose`, {});

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

        await messageTemplatesModel.updateData({ status_id: 10 }, { template_id: id });
        await whatsappTemplatesModel.updateData({
            status_id: 'pending',
            campaign_status_id: 7,
            is_propose: 1
        }, { waba_template_id: id });

        logger.success({
            from: 'message-templates:proposeTemplate',
            message: `Propose template success! ID ${id}`,
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'templates:proposeTemplate',
            message: `Propose template error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Propose template error!');
    }
};
