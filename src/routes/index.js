const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const responseHelper = require('./../helpers/response');
const fileHelper = require('./../helpers/file');
const authMiddleware = require('./../middleware/auth');

const { readdirSync, statSync } = fs;
const { getContent } = fileHelper;
const { authenticateKey } = authMiddleware;

const basename = path.basename(__filename);
const publicPaths = ['webhook', 'whatsapp'];

/**
 * checks if a given string matches any of the provided regular expressions
 * @param {string} string - string to test
 * @param {Array<RegExp>} expressions - an array of regular expressions
 * @returns {boolean} - true if a match is found, false otherwise
 */
const matchInArray = (string, expressions) => {
    for (const exp of expressions) {
        if (string.match(exp)) {
            return true;
        }
    }

    return false;
};

/**
 * middleware factory to conditionally apply a middleware
 * middleware will NOT be applied if the request path is in the `pathArr` or matches any of the regexes derived from `pathArr`
 * @param {Array<string>} pathArr - array of paths (or path segments) to exclude the middleware from
 * @param {Function} middleware - middleware to apply conditionally
 * @returns {Function} - conditional middleware function
 */
const unlessPath = (pathArr = [], middleware) => {
    return function (req, res, next) {
        const insideRegex = matchInArray(req.path, pathArr.map((p) => new RegExp(p)));

        if (pathArr.includes(req.path) || insideRegex) {
            return next();
        }

        return middleware(req, res, next);
    };
};

// ---
// ## root route
router.get('/', (req, res) => {
    let pkg = {};

    try {
        pkg = JSON.parse(getContent('package.json'));
    } catch (__err) {
        // do nothing
    }

    if (pkg?.name && typeof pkg.name === 'string') {
        pkg.name = pkg.name.split('-').map((w) => w.toLowerCase() === 'api' ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return res.send({ app: pkg?.name || 'Gateway' });
});

// ---
// ## authentication middleware
// require x-api-key header for all routes EXCEPT those in publicPaths
router.use(unlessPath([...publicPaths], authenticateKey));

// ---
// ## dynamic route load
readdirSync(__dirname)
    .filter((file) => file !== basename && path.extname(file) === '.js' && statSync(path.join(__dirname, file)).isFile())
    .forEach((file) => {
        const filename = path.parse(file).name;
        router.use(`/${filename}`, require(`./${filename}`));
    });

// ---
// ## for non-existing routes (404 Not Found)
router.use((req, res, next) => {
    responseHelper.sendNotFound(res);
});

module.exports = router;
