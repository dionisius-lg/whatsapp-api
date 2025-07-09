const fs = require('fs');
const logger = require('./../helpers/logger');
const encryptionHelper = require('./../helpers/encryption');
const fileHelper = require('./../helpers/file');
const responseHelper = require('./../helpers/response');

const { existsSync } = fs;
const { decrypt } = encryptionHelper;
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
 * Download File
 * @param {Request} req 
 * @param {Response} res 
 * @returns response
 */
exports.downloadFile = async (req, res) => {
    const { params: { id } } = req;

    try {
        const decrypted = decrypt(id);
        const { path, file_name, file_size, mime_type } = JSON.parse(decrypted);
        const fullpath = (`${path}/${file_name}`).replace(/\/+/g, '/');

        if (existsSync(fullpath)) {
            if (mimeTypes().includes(mime_type)) {
                res.set({
                    'Content-Disposition': `attachment; filename=${file_name}`,
                    'Content-Type': mime_type,
                    'Content-Length': file_size
                });

                return res.sendFile(file_name, { root: path });
            }

            return res.download(fullpath);
        }

        return responseHelper.sendNotFoundData(res);
    } catch (err) {
        logger.error({
            from: 'files:downloadFile',
            message: `Download file ${id} error! ${err?.message}`,
            result: err
        });

        return responseHelper.sendInternalServerError(res);
    }
};
