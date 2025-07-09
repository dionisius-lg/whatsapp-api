const router = require('express').Router();
const controller = require('./../controllers/template-categories');

router.get('/', controller.fetchCategories);

module.exports = router;
