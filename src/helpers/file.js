const fs = require('fs');
const path = require('path');
const valueHelper = require('./value');

const { existsSync, mkdirSync, readFileSync, writeFileSync } = fs;
const { dirname } = path;
const { isEmpty } = valueHelper;

exports.getContent = (filename = '', subpath = '') => {
    try {
        if (isEmpty(filename)) {
            throw new Error('Filename cannot be empty');
        }

        // sanitize filename
        filename = filename.replace(/[^a-zA-Z0-9 _.\-]/g, '').trim();

        let filepath = dirname(require.main.filename) + '/';

        if (subpath && !isEmpty(subpath)) {
            // replace multiple slash to single slash
            subpath = subpath.replace(/\/+/g, '/');
            // remove first & last slash
            subpath = subpath.replace(/^\/|\/$/g, '');
            // concat filepath with concat
            filepath += `${subpath}/`;
        }

        const fullpath = `${filepath}${filename}`;

        if (!existsSync(fullpath)) {
            throw new Error(`File not found: ${fullpath}`);
        }

        const result = readFileSync(fullpath, 'utf-8');

        return result;
    } catch (__err) {
        return null;
    }
};

exports.putContent = (filename = '', data = '', subpath = '') => {
    try {
        if (isEmpty(filename) || isEmpty(data)) {
            throw new Error('Filename or data cannot be empty');
        }

        // sanitize filename
        filename = filename.replace(/[^a-zA-Z0-9 _.\-]/g, '').trim();

        let filepath = dirname(require.main.filename) + '/';

        if (subpath && !isEmpty(subpath)) {
            // replace multiple slash to single slash
            subpath = subpath.replace(/\/+/g, '/');
            // remove first & last slash
            subpath = subpath.replace(/^\/|\/$/g, '');
            // concat filepath with concat
            filepath += `${subpath}/`;

            if (!existsSync(filepath)) {
                mkdirSync(filepath, { mode: 0o777, recursive: true });
            }
        }

        const fullpath = `${filepath}${filename}`;

        writeFileSync(fullpath, data, 'utf8');

        return fullpath;
    } catch (__err) {
        return null;
    }
};

exports.imageFilter = (req, file, cb) => {
    const mimetype = file?.mimetype || '';
    const filetype = mimetype.split('/');

    // accept image only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/) || filetype[0] != 'image') {
        return cb(new Error('Only image files are allowed'), false);
    }

    return cb(null, true);
};
