const Joi = require('joi');
const JoiDate = require('@joi/date');
const JoiStringFactory = require('joi-phone-number');
// extend Joi with JoiDate and JoiStringFactory
const JoiExtended = Joi.extend(JoiDate).extend(JoiStringFactory);

const schema = {
    downloadMedia: JoiExtended.object().keys({
        id: JoiExtended.string().required()
    })
};

module.exports = schema;
