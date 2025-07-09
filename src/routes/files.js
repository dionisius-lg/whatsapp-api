const router = require('express').Router();
const controller = require('./../controllers/files');
const validation = require('./../middleware/validation');
const schema = require('./../schemas/files');

router.get('/:id', validation(schema.downloadFile, 'params'), controller.downloadFile);

module.exports = router;
