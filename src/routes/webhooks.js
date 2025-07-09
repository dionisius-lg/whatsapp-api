const router = require('express').Router();
const controller = require('./../controllers/webhooks');

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
