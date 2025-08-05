const axios = require('axios');
const fs = require('fs');
const dateFormat = require('dateformat');
const mime = require('mime-types');
const config = require('./../config');
const logger = require('./logger');
const valueHelper = require('./value');

const { createWriteStream, existsSync, mkdirSync, statSync } = fs;
const { file_dir } = config;
const { isEmpty, isValidUrl, randomString } = valueHelper;

exports.getMimeType = async (url) => {
    try {
        if (isEmpty(url)) {
            throw new Error('Invalid url');
        }

        const api = await axios.head(url);

        let mimeType = api.headers['content-type'] || '';

        if (isEmpty(mimeType)) {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const ext = pathname.split('.').pop();
            mimeType = mime.lookup(ext) || 'application/octet-stream';
        }

        return mimeType;
    } catch (_err) {
        return null;
    }
};

exports.downloadFile = async (url) => {
    try {
        if (isEmpty(url) || !isValidUrl(url)) {
            throw new Error('Invalid url');
        }

        const ymd = dateFormat(new Date(), 'yyyy/mm/dd');
        const path = `${file_dir}/${ymd}`;

        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true, mode: 0o777 });
        }

        const api = await axios.get(url, { responseType: 'stream' });
        const mimetype = api.headers['content-type'] || '';
        const extension = mime.extension(mimetype);

        let filename = api.headers['content-disposition'] || api.headers['content-dispositon'] || '';
        filename = (filename.split('filename=')[1] || '').split('.')[0];
        filename = filename.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

        if (isEmpty(filename)) {
            filename = randomString(24, true);
        }

        filename += `${Math.floor(1000 + Math.random() * 9000)}`;
        filename += `.${extension}`;

        const filestream = createWriteStream(`${path}/${filename}`);

        api.data.pipe(filestream);

        await new Promise((resolve, reject) => {
            filestream.on('finish', resolve);
            filestream.on('error', reject);
        });

        const filesize = statSync(`${path}/${filename}`).size;

        return {
            path,
            filename,
            size: filesize,
            mimetype
        };
    } catch (err) {
        logger.error({
            from: 'media:downloadFile',
            message: `Download media error! ${err?.message}`
        });

        return null;
    }
};
