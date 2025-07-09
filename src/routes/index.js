const router = require('express').Router();
const { readdirSync } = require('fs');
const path = require('path');
const { env } = require('./../config');
const response = require('./../helpers/response');
const { authenticateKey } = require('./../middleware/auth');

const basename = path.basename(__filename);
const publicPath = ['/webhooks', '/files'];

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
    return res.send({ app: 'Whatsapp Gateway API' });
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
router.use('*', (req, res) => {
    response.sendNotFound(res);
});

if (env === 'production') {
    // override error
    router.use((err, req, res, next) => {
        if (err instanceof SyntaxError) {
            return response.sendBadRequest(res);
        }

        console.error(err.stack);
        response.sendInternalServerError(res);
    });
}

module.exports = router;
