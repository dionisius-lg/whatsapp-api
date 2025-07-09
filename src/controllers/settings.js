const fs = require('fs');
const formData = require('form-data');
const config = require('./../config');
const logger = require('./../helpers/logger');
const responseHelper = require('./../helpers/response');
const encryptionHelper = require('./../helpers/encryption');
const valueHelper = require('./../helpers/value');
const whatsappApi = require('./../helpers/whatsapp-api');
const settingsModel = require('./../models/settings');

const { createReadStream, existsSync, unlinkSync } = fs;
const { whatsapp: { bsp }, port } = config;
const { encrypt } = encryptionHelper;
const { isDomainAddress, isJson } = valueHelper;

/**
 * Get Whatsapp Business Profile
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.getProfile = async (req, res) => {
    try {
        if (bsp !== 'IVO') {
            throw new Error('This endpoint is not support for current config');
        }

        const { data } = await settingsModel.getDetail({ code: 'WHATSAPP_PROFILE' });

        if (data) {
            let { attributes } = data;

            if (isJson(attributes) && attributes.length > 0) {
                attributes = JSON.parse(attributes);
                const profile = attributes;

                const result = { profile };

                return responseHelper.sendSuccess(res, result);
            }
        }

        const api = await whatsappApi.get('/settings/business-profile');

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

        const { data: { settings: { business: { profile } } } } = api;
        await settingsModel.insertUpdateData([{ code: 'WHATSAPP_PROFILE', attributes: JSON.stringify(profile) }]);

        logger.success({
            from: 'settings:getProfile',
            message: 'Get business profile success',
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, { profile });
    } catch (err) {
        logger.error({
            from: 'settings:getProfile',
            message: `Get business profile error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Get business profile error!');
    }
};

/**
 * Update Whatsapp Business Profile
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.updateProfile = async (req, res) => {
    const { body } = req;

    try {
        if (bsp !== 'IVO') {
            throw new Error('This endpoint is not support for current config');
        }

        let profileData = {
            code: 'WHATSAPP_PROFILE',
            attributes: JSON.stringify(body)
        };

        const api = await whatsappApi.post('/settings/business-profile', body);

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

        await settingsModel.insertUpdateData([profileData]);

        logger.success({
            from: 'settings:updateProfile',
            message: 'Update business profile success',
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'settings:updateProfile',
            message: `Update business profile error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Update business profile error!');
    }
};

/**
 * Get Whatsapp Business Profile About
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.getProfileAbout = async (req, res) => {
    try {
        if (bsp !== 'IVO') {
            throw new Error('This endpoint is not support for current config');
        }

        const { data } = await settingsModel.getDetail({ code: 'WHATSAPP_PROFILE_ABOUT' });

        if (data) {
            let { attributes } = data;

            if (isJson(attributes) && attributes.length > 0) {
                attributes = JSON.parse(attributes);
                const { text } = attributes;

                const result = { about: { text } };

                return responseHelper.sendSuccess(res, result);
            }
        }

        const api = await whatsappApi.get('/settings/profiles/about');

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

        const { data: { settings: { profile: { about } } } } = api;
        await settingsModel.insertUpdateData([{ code: 'WHATSAPP_PROFILE_ABOUT', attributes: JSON.stringify(about) }]);

        logger.success({
            from: 'settings:getProfileAbout',
            message: 'Get business profile about success',
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, { about });
    } catch (err) {
        logger.error({
            from: 'settings:getProfileAbout',
            message: `Get business profile about error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Get business profile about error!');
    }
};

/**
 * Update Whatsapp Business Profile About
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.updateProfileAbout = async (req, res) => {
    const { body } = req;

    try {
        if (bsp !== 'IVO') {
            throw new Error('This endpoint is not support for current config');
        }

        let profileAboutData = {
            code: 'WHATSAPP_PROFILE_ABOUT',
            attributes: JSON.stringify(body)
        };

        const api = await whatsappApi.patch('/settings/profiles/about', body);

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

        await settingsModel.insertUpdateData([profileAboutData]);

        logger.success({
            from: 'settings:updateProfileAbout',
            message: 'Update business profile about success',
            result: api?.data || null
        });

        return response.sendSuccess(res, api?.data || null);
    } catch (err) {
        logger.error({
            from: 'settings:updateProfileAbout',
            message: `Update business profile about error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Update business profile about error!');
    }
};

/**
 * Get Whatsapp Business Profile Photo
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.getProfilePhoto = async (req, res) => {
    const { hostname } = req;

    try {
        if (bsp !== 'IVO') {
            throw new Error('This endpoint is not support for current config');
        }

        const { data } = await settingsModel.getDetail({ code: 'WHATSAPP_PROFILE_PHOTO' });

        if (data) {
            const { attributes } = data;

            if (isJson(attributes) && attributes.length > 0) {
                const file = JSON.parse(attributes);

                if (existsSync(`${file?.path}${file?.file_name}`)) {
                    const encrypted = encrypt(attributes);
                    let link = `http://${hostname}:${port}/files/${encrypted}`;

                    if (isDomainAddress(hostname)) {
                        link = `https://${hostname}/whatsapp-api/files/${encrypted}`;
                    }

                    const result = { photo: { link } };

                    return responseHelper.sendSuccess(res, result);
                }
            }
        }

        const api = await whatsappApi.get('/settings/profiles/photo');

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

        const { data: { settings: { profile: { photo } } } } = api;

        logger.success({
            from: 'settings:getProfilePhoto',
            message: 'Get business profile photo success',
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, { photo });
    } catch (err) {
        logger.error({
            from: 'settings:getProfilePhoto',
            message: `Get business profile photo error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Get business profile photo error!');
    }
};

/**
 * Update Whatsapp Business Profile Photo
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.updateProfilePhoto = async (req, res) => {
    const { file } = req;

    try {
        if (bsp !== 'IVO') {
            throw new Error('This endpoint is not support for current config');
        }

        const attributes = {
            path: file.destination.replace(/\/+/g, '/'),
            file_name: file.filename,
            file_size: file.size,
            mime_type: file.mimetype
        };

        let profilePhotoData = {
            code: 'WHATSAPP_PROFILE_PHOTO',
            description: 'Whatsapp Business Profile Photo',
            attributes: JSON.stringify(attributes)
        };

        let body = new formData();
        body.append('photo', createReadStream(file.path));

        const api = await whatsappApi.post('/settings/business-profile', body);

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

        await settingsModel.insertUpdateData([profilePhotoData]);

        logger.success({
            from: 'settings:updateProfilePhoto',
            message: 'Update business profile photo success',
            result: api?.data || null
        });

        return responseHelper.sendSuccess(res, api?.data || null);
    } catch (err) {
        if (existsSync(file.path)) {
            unlinkSync(file.path);
        }

        logger.error({
            from: 'settings:updateProfilePhoto',
            message: `Update business profile photo error! ${err?.message}`,
            result: err?.cause || null
        });

        return responseHelper.sendBadRequest(res, err?.message || 'Update business profile photo error!');
    }
};
