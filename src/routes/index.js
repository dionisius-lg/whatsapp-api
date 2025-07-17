const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const config = require('./../config');
const authMiddleware = require('./../middleware/auth');
const fileHelper = require('./../helpers/file');
const responseHelper = require('./../helpers/response');

const { readdirSync } = fs;
const { env } = config;
const { authenticateKey } = authMiddleware;
const { getContent } = fileHelper;
const basename = path.basename(__filename);
const publicPath = ['/webhooks', '/files'];

const packageData = () => {
    try {
        const fileData = getContent('package.json');
        const jsonData = JSON.parse(fileData);

        if (typeof jsonData === 'object' && Object.keys(jsonData).length > 0) {
            return jsonData;
        }

        throw new Error('Get content failed');
    } catch (_err) {
        return {};
    }
};

const matchInArray = (string, expression) => {
    for (let exp of expression) {
        if (string.match(exp)) {
            return true;
        }
    }

    return false;
};

const unlessPath = (pathArr = [], middleware) => {
    return function (req, res, next) {
        const insideRegex = matchInArray(req.path, pathArr.map((p) => new RegExp(p)));

        if (pathArr.includes(req.path) || insideRegex) {
            return next();
        }

        return middleware(req, res, next);
    };
};

router.get('/', (req, res) => {
    let pkg = packageData();

    if (pkg?.name && typeof pkg.name === 'string') {
        // split the string into an array by hyphens, capitalize the first letter of each word, join the words with a space
        pkg.name = pkg.name.split('-').map((w) => w === 'api' ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return res.send({ app: pkg?.name || 'API' });
});

// require x-api-key header
router.use(unlessPath([...publicPath], authenticateKey));

readdirSync(__dirname).filter((file) => {
    return file.includes('.') && file !== basename && path.extname(file) === '.js';
}).forEach((file) => {
    let filename = path.parse(file).name;
    router.use(`/${filename}`, require(`./${filename}`));
});

// for non-existing route
router.use((req, res, next) => {
    responseHelper.sendNotFound(res);
});

if (env === 'production') {
    // override error
    router.use((err, req, res, next) => {
        if (err instanceof SyntaxError) {
            return responseHelper.sendBadRequest(res);
        }

        console.error(err.stack);
        responseHelper.sendInternalServerError(res);
    });
}

module.exports = router;
