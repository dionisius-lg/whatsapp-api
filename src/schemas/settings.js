const Joi = require('joi');
const JoiDate = require('@joi/date');
const JoiStringFactory = require('joi-phone-number');
// extend Joi with JoiDate and JoiStringFactory
const JoiExtended = Joi.extend(JoiDate).extend(JoiStringFactory);

const schema = {
    updateProfile: JoiExtended.object().keys({
        address: JoiExtended.string().min(1).required(),
        description: JoiExtended.string().min(1).required(),
        email: JoiExtended.string().min(1).required(),
        vertical: JoiExtended.string().min(1).required(),
        websites: JoiExtended.array().min(1).items(JoiExtended.string().uri().required()).required()
    }),

    updateProfileAbout: JoiExtended.object().keys({
        text: JoiExtended.string().min(1).required()
    })
};

module.exports = schema;
