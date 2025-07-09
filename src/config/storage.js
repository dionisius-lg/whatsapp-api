const multer = require('multer');
const fs = require('fs');
const config = require('./index');
const valueHelper = require('./../helpers/value');

const { existsSync, mkdirSync } = fs;
const { file_dir } = config;
const { isEmpty } = valueHelper;

const storage = ({ subpath = '' }) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            let path = file_dir.replace(/^\/|\/$/g, ''); // remove first & last slash
            path = path.replace(/\/+/g, '/'); // replace multiple slash to single slash
            path = `/${path}/`;

            if (!isEmpty(subpath)) {
                path += subpath.replace(/^\/|\/$/g, '') + '/'; // remove first & last slash
                path = path.replace(/\/+/g, '/'); // replace multiple slash to single slash
            }

            if (!existsSync(path)) {
                mkdirSync(path, { mode: 0o777, recursive: true });
            }

            cb(null, path);
        },
        filename: (req, file, cb) => {
            const { originalname, fieldname } = file;
            const extension = originalname.split('.').pop();
            const random = `${Math.floor(1000 + Math.random() * 9000)}` + Date.now();

            cb(null, `${fieldname}-${Date.now()}${random}.${extension}`);
        }
    });
};

module.exports = storage;
