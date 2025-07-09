const router = require('express').Router();
const controller = require('./../controllers/medias');
const validation = require('./../middleware/validation');
const schema = require('./../schemas/medias');

router.get('/:id', validation(schema.downloadMedia, 'params'), controller.downloadMedia);

module.exports = router;
