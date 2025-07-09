const router = require('express').Router();
const controller = require('./../controllers/app-clients');
const validation = require('./../middleware/validation');
const schema = require('./../schemas/app-clients');

router.get('/', controller.getData);

router.get('/:id', validation(schema.detailById, 'params'), controller.getDataById);

router.post('/', validation(schema.insertData, 'body'), controller.insertData);

router.put('/:id', validation(schema.updateData, 'body'), controller.updateData);

module.exports = router;
