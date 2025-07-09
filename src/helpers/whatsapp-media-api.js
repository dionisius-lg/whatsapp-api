const fs = require('fs');
const axios = require('axios');
const dateFormat = require('dateformat');
const mime = require('mime-types');
const config = require('./../config');
const logger = require('./logger');
const valueHelper = require('./value');

const { createWriteStream, existsSync, mkdirSync, statSync } = fs;
const { whatsapp: { url, key }, file_dir } = config;
const { isEmpty } = valueHelper;

const instance = axios.create({
    baseURL: url,
    headers: { 'X-Api-Key': key },
    responseType: 'stream'
});

const download = async ({ id = '', mime_type = '' }) => {
    const ymd = dateFormat(new Date(), 'yyyy/mm/dd');

    try {
        const api = await instance.get(`/media/${id}`);
        const { headers, status } = api;

        if (isEmpty(mime_type)) {
            mime_type = headers['content-type'] || '';
        }

        let file_name = headers['content-disposition'] || headers['content-dispositon'] || '';
        file_name = (file_name.split('filename=')[1] || '').split('.')[0];
        file_name = file_name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

        if (isEmpty(file_name)) {
            file_name = id;
        }

        file_name += `${Math.floor(1000 + Math.random() * 9000)}`;

        const extension = mime.extension(mime_type);
        const path = `${file_dir}/media/${ymd}`;

        if (extension) {
            file_name += `.${extension}`;
        }

        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true, mode: 0o777 });
        }

        const stream = createWriteStream(`${path}/${file_name}`);

        // listen to 'finish' event to get the size after writing
        let bytes = 0;

        api.data.on('data', chunk => {
            // increment total bytes written
            bytes += chunk.length;
        });

        console.log(`Total ${bytes} byte(s)`);

        api.data.pipe(stream);

        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        const file_size = statSync(`${path}/${file_name}`).size;
        const data = { path, file_name, file_size, mime_type };

        return { status, data };
    } catch (err) {
        if (err.response) {
            logger.error({
                from: 'whatsapp-media-api',
                message: `Whatsapp Media Api error! ${err?.message}`,
                result: err.response?.data || err
            });

            return {
                status: err.response?.status || 400,
                data: err.response?.data || { error: 'Bad request' }
            };
        }

        logger.error({
            from: 'whatsapp-media-api',
            message: `Whatsapp Media Api error! ${err?.message}`
        });

        return {
            status: 500,
            data: { error: 'Internal Server Error' }
        };
    }
};

module.exports = { download };
