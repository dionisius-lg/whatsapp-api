const joi = require('joi');
const joiDate = require('@joi/date');
const joiStringFactory = require('joi-phone-number');
// extend joi with joiDate and joiStringFactory
const joiExtended = joi.extend(joiDate).extend(joiStringFactory);
const fileHelper = require('./../helpers/file');

const dialCodes = () => {
    try {
        const fileData = fileHelper.getContent('dial-codes.json');
        const jsonData = JSON.parse(fileData);

        if (Array.isArray(jsonData)) {
            return jsonData;
        }

        throw new Error('Get content failed');
    } catch (_err) {
        return [];
    }
};

const langCodes = () => {
    try {
        const fileData = fileHelper.getContent('lang-codes.json');
        const jsonData = JSON.parse(fileData);

        if (Array.isArray(jsonData)) {
            return jsonData;
        }

        throw new Error('Get content failed');
    } catch (_err) {
        return [];
    }
};

const schema = {
    fetchTemplateById: joiExtended.object().keys({
        id: joiExtended.string().min(1).required()
    }),

    createTemplate: joiExtended.object().keys({
        label: joiExtended.string().min(1).required(),
        category_id: joiExtended.string().min(1).valid('MARKETING', 'UTILITY').insensitive().uppercase().required(),
        language_id: joiExtended.string().min(1).valid(...langCodes()).required(),
        is_propose: joiExtended.boolean().default(false),
        allow_category_change: joiExtended.boolean().default(false),
        header: joiExtended.object().keys({
            format: joiExtended.string().min(1).valid('DOCUMENT', 'IMAGE', 'TEXT', 'VIDEO').insensitive().uppercase().required(),
            text: joiExtended.any().when('format', {
                is: joiExtended.string().valid('TEXT'),
                then: joiExtended.string().min(1).required(),
                otherwise: joiExtended.strip()
            }),
            examples: joiExtended.any().when('format', {
                not: joiExtended.string().valid('TEXT'),
                then: joiExtended.array().length(1).items(
                    joiExtended.string().min(1).required()
                ).required(),
                otherwise: joiExtended.strip()
            }),
            filename: joiExtended.any().when('format', {
                is: joiExtended.string().valid('DOCUMENT'),
                then: joiExtended.string().min(1),
                otherwise: joiExtended.strip()
            })
        }),
        body: joiExtended.object().keys({
            text: joiExtended.string().min(1).required(),
            examples: joiExtended.array().items(
                joiExtended.string().min(1)
            ).default([])
        }).required(),
        footer: joiExtended.string().min(1),
        buttons: joiExtended.array().min(1).items(
            joiExtended.object().keys({
                type: joiExtended.string().min(1).valid('PHONE_NUMBER', 'URL').insensitive().uppercase().required(),
                text: joiExtended.string().min(1).required(),
                country_code: joiExtended.any().when('type', {
                    is: joiExtended.string().valid('PHONE_NUMBER'),
                    then: joiExtended.string().min(1).valid(...dialCodes()),
                    otherwise: joiExtended.strip()
                }),
                phone_number: joiExtended.any().when('type', {
                    is: joiExtended.string().valid('PHONE_NUMBER'),
                    then: joiExtended.string().min(1).required(),
                    otherwise: joiExtended.strip()
                }),
                url: joiExtended.any().when('type', {
                    is: joiExtended.string().valid('URL'),
                    then: joiExtended.string().uri().required(),
                    otherwise: joiExtended.strip()
                })
            })
        )
    }),

    updateTemplate: joiExtended.object().keys({
        label: joiExtended.string().min(1).required(),
        category_id: joiExtended.string().min(1).valid('MARKETING', 'UTILITY').insensitive().uppercase().required(),
        language_id: joiExtended.string().min(1).valid(...langCodes()).required(),
        is_propose: joiExtended.boolean(),
        allow_category_change: joiExtended.any().strip(),
        header: joiExtended.object().keys({
            format: joiExtended.string().min(1).valid('DOCUMENT', 'IMAGE', 'TEXT', 'VIDEO').insensitive().uppercase().required(),
            text: joiExtended.any().when('format', {
                is: joiExtended.string().valid('TEXT'),
                then: joiExtended.string().min(1).required(),
                otherwise: joiExtended.strip()
            }),
            examples: joiExtended.any().when('format', {
                not: joiExtended.string().valid('TEXT'),
                then: joiExtended.array().length(1).items(
                    joiExtended.string().min(1).required()
                ).required(),
                otherwise: joiExtended.strip()
            }),
            filename: joiExtended.any().when('format', {
                is: joiExtended.string().valid('DOCUMENT'),
                then: joiExtended.string().min(1),
                otherwise: joiExtended.strip()
            })
        }),
        body: joiExtended.object().keys({
            text: joiExtended.string().min(1).required(),
            examples: joiExtended.array().items(
                joiExtended.string().min(1)
            ).default([])
        }).required(),
        footer: joiExtended.string().min(1),
        buttons: joiExtended.array().min(1).items(
            joiExtended.object().keys({
                type: joiExtended.string().min(1).valid('PHONE_NUMBER', 'URL').insensitive().uppercase().required(),
                text: joiExtended.string().min(1).required(),
                country_code: joiExtended.any().when('type', {
                    is: joiExtended.string().valid('PHONE_NUMBER'),
                    then: joiExtended.string().min(1).valid(...dialCodes()),
                    otherwise: joiExtended.strip()
                }),
                phone_number: joiExtended.any().when('type', {
                    is: joiExtended.string().valid('PHONE_NUMBER'),
                    then: joiExtended.string().min(1).required(),
                    otherwise: joiExtended.strip()
                }),
                url: joiExtended.any().when('type', {
                    is: joiExtended.string().valid('URL'),
                    then: joiExtended.string().uri().required(),
                    otherwise: joiExtended.strip()
                })
            })
        )
    })
};

module.exports = schema;
