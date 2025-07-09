const axios = require('axios');
const mime = require('mime-types');
const valueHelper = require('./value');

const { isEmpty } = valueHelper;

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
