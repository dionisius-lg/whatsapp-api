const dateFormat = require('dateformat');
const multer = require('multer');
const storage = require('./../config/storage');
const responseHelper = require('./../helpers/response');
const fileHelper = require('./../helpers/file');

const { imageFilter } = fileHelper;

const singleFile = ({ fieldname = '', subpath = '', filesize = 1, filefilter = '' }) => {
    return (req, res, next) => {
        const ymd = dateFormat(new Date(), 'yyyy/mm/dd');

        let options = {
            storage: storage(`${subpath}/${ymd}`),
            limits: { fileSize: 1000000 * filesize } // limits in bytes
        };

        if (filefilter && filefilter.trim().toLowerCase() === 'image') {
            options.fileFilter = imageFilter;
        }

        const upload = multer(options).single(fieldname);

        upload(req, res, async (err) => {
            if (!req.file) {
                return responseHelper.sendBadRequest(res, 'Please select file to upload');
            }

            if (err) {
                return responseHelper.sendBadRequest(res, err?.message || 'File failed to upload');
            }

            next();
        });
    };
};

const multiFile = ({ fieldname, subpath = '', filesize = 1, filefilter, filemax = 1 }) => {
    return (req, res, next) => {
        const ymd = dateFormat(new Date(), 'yyyy/mm/dd');

        let options = {
            storage: storage(`${subpath}/${ymd}`),
            limits: { fileSize: 1000000 * filesize } // limits in bytes
        };

        if (filefilter && filefilter.trim().toLowerCase() === 'image') {
            options.fileFilter = imageFilter;
        }

        const upload = multer(options).array(fieldname, filemax);

        upload(req, res, async (err) => {
            if (!req.files) {
                return responseHelper.sendBadRequest(res, 'Please select file to upload');
            }

            if (err) {
                return responseHelper.sendBadRequest(res, err?.message || 'File failed to upload');
            }

            next();
        });
    };
};

module.exports = {
    singleFile,
    multiFile
};
