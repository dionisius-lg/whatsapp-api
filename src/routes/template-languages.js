const router = require('express').Router();
const controller = require('./../controllers/template-languages');

router.get('/', controller.fetchLanguages);

module.exports = router;
