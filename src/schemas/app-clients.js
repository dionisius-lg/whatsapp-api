const Joi = require('joi');
const JoiDate = require('@joi/date');
const JoiStringFactory = require('joi-phone-number');
// extend Joi with JoiDate and JoiStringFactory
const JoiExtended = Joi.extend(JoiDate).extend(JoiStringFactory);
const { isJson, isPlainObject } = require('./../helpers/value');

const schema = {
    detailById: JoiExtended.object().keys({
        id: JoiExtended.number().min(1).required()
    }),
    insertData: JoiExtended.object().keys({
        name: JoiExtended.string().min(1).required(),
        webhook_url: JoiExtended.string().uri(),
        webhook_auth: JoiExtended.string().min(1).custom((value, helpers) => {
            if (!isJson(value) || !isPlainObject(JSON.parse(value))) {
                if (helpers.original === value) {
                    let { state: { path }, message } = helpers;

                    return message(`"${path[0]}[${path[1]}].${path[2]}" must be a valid json string of object`);
                }
            }

            return value;
        }),
        is_active: JoiExtended.number().valid(1, 0)
    }),
    updateData: JoiExtended.object().keys({
        name: JoiExtended.string().min(1),
        webhook_url: JoiExtended.string().uri(),
        webhook_auth: JoiExtended.string().min(1).custom((value, helpers) => {
            if (!isJson(value) || !isPlainObject(JSON.parse(value))) {
                if (helpers.original === value) {
                    let { state: { path }, message } = helpers;

                    return message(`"${path[0]}[${path[1]}].${path[2]}" must be a valid json string of object`);
                }
            }

            return value;
        }),
        is_active: JoiExtended.number().valid(1, 0)
    })
};

module.exports = schema;
