const router = require('express').Router();
const controller = require('./../controllers/message-templates');
const validation = require('./../middleware/validation');
const schema = require('./../schemas/message-templates');

router.get('/', controller.fetchTemplate);

router.post('/', validation(schema.createTemplate, 'body'), controller.createTemplate);

router.get('/:id', validation(schema.fetchTemplateById, 'params'), controller.fetchTemplate);

router.put('/:id', validation(schema.fetchTemplateById, 'params'), validation(schema.updateTemplate, 'body'), controller.updateTemplate);

router.post('/:id/propose', validation(schema.fetchTemplateById, 'params'), controller.proposeTemplate);

module.exports = router;
