const router = require('express').Router();
const controller = require('./../controllers/settings');
const validation = require('./../middleware/validation');
const fileValidation = require('./../middleware/file-validation');
const schema = require('./../schemas/settings');

router.get('/profiles', controller.getProfile);

router.post('/profiles', validation(schema.updateProfile, 'body'), controller.updateProfile);

router.get('/profiles/about', controller.getProfileAbout);

router.post('/profiles/about', validation(schema.updateProfileAbout, 'body'), controller.updateProfileAbout);

router.get('/profiles/photo', controller.getProfilePhoto);

router.post('/profiles/photo', fileValidation.singleFile({ fieldname: 'photo', filesize: 5, subpath: 'profile', filefilter: 'image' }), controller.updateProfilePhoto);

module.exports = router;
