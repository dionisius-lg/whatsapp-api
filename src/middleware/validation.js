const fs = require('fs');
const responseHelper = require('./../helpers/response');

const { existsSync, unlinkSync } = fs;

const validation = (schema, property, file = false) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property]);

        if (error) {
            const { details } = error;
            const message = details.map((i) => i.message).join(',');

            // check file upload
            if (file) {
                switch (true) {
                    // single file
                    case (req.file !== undefined):
                        const { destination, filename } = req.file;
                        const file = `${destination}/${filename}`;

                        // delete file that already uploaded by multer middleware
                        if (existsSync(file)) {
                            unlinkSync(file);
                        }

                        break;
                    // multiple file
                    case (req.files !== undefined):
                        for (let f of req.files) {
                            const { destination, filename } = f;
                            const file = `${destination}/${filename}`;

                            // delete files that already uploaded by multer middleware
                            if (existsSync(file)) {
                                unlinkSync(file);
                            }
                        }
                        
                        break;
                }
            }

            return responseHelper.sendBadRequest(res, message);
        }

        if (property === 'body') {
            req.body = value;
        }

        return next();
    };
};

module.exports = validation;
