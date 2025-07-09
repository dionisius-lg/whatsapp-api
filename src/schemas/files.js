const Joi = require('joi');
const JoiDate = require('@joi/date');
const JoiStringFactory = require('joi-phone-number');
// extend Joi with JoiDate and JoiStringFactory
const JoiExtended = Joi.extend(JoiDate).extend(JoiStringFactory);

const schema = {
    downloadFile: JoiExtended.object().keys({
        id: JoiExtended.string().min(1).required()
    })
};

module.exports = schema;
