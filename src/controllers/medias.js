const fs = require('fs');
const fileHelper = require('./../helpers/file');
const logger = require('./../helpers/logger');
const responseHelper = require('./../helpers/response');
const whatsappMediaApi = require('./../helpers/whatsapp-media-api');
const mediasModel = require('./../models/medias');

const { existsSync } = fs;
const { getContent } = fileHelper;

const mimeTypes = () => {
    try {
        const fileData = getContent('mime-types.json');
        const jsonData = JSON.parse(fileData);

        if (Array.isArray(jsonData)) {
            return jsonData;
        }

        throw new Error('Get content failed');
    } catch (_err) {
        return [];
    }
};

/**
 * Download Media
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.downloadMedia = async (req, res) => {
    const { params: { id } } = req;

    try {
        let { data } = await mediasModel.getDetail({ wa_media_id: id });

        if (!data) {
            const api = await whatsappMediaApi.download({ id });

            if (![200, 201].includes(api.status)) {
                let message = 'Invalid request';

                if (api?.data?.errors) {
                    message = api.data.errors;
                }

                throw new Error(message, { cause: api?.data || null });
            }

            data = api.data;

            await mediasModel.insertUpdateData([{ ...data, wa_media_id: id }]);
        }

        const fullpath = (`${data.path}/${data.file_name}`).replace(/\/+/g, '/');

        if (existsSync(fullpath)) {
            if (mimeTypes().includes(data.mime_type)) {
                res.set({
                    'Content-Disposition': `attachment; filename=${data.file_name}`,
                    'Content-Type': data.mime_type,
                    'Content-Length': data.file_size
                });

                return res.sendFile(data.file_name, { root: data.path });
            }

            return res.download(fullpath);
        }

        throw new Error('Data not found');
    } catch (err) {
        logger.error({
            from: 'medias:downloadMedia',
            message: `Download media ${id} error! ${err?.message}`
        });

        return responseHelper.sendBadRequest(res, err?.message || `Download media ${id} error!`);
    }
};
