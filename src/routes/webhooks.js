const router = require('express').Router();
const controller = require('./../controllers/webhooks');
const fileHelper = require('./../helpers/file');

const { getContent } = fileHelper;

router.get('/', (req, res) => {
    let pkg = JSON.parse(getContent('package.json'));

    if (pkg?.name && typeof pkg.name === 'string') {
        // split the string into an array by hyphens, capitalize the first letter of each word, join the words with a space
        pkg.name = pkg.name.split('-').map((w) => w === 'api' ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return res.send({ app: pkg?.name + ' Webhook' || 'API Webhook' });
});

router.post('/', async (req, res) => {
    const { body } = req;

    switch (true) {
        case (body.hasOwnProperty('contacts')):
            return controller.inboundMessage(req, res);
            break;
        case (body.hasOwnProperty('statuses')):
            return controller.inboundStatus(req, res);
        default:
            return controller.inbound(req, res);
            break;
    }
});

module.exports = router;
