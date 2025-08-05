const joi = require('joi');
const joiDate = require('@joi/date');
const joiStringFactory = require('joi-phone-number');
// extend joi with joiDate and joiStringFactory
const joiExtended = joi.extend(joiDate).extend(joiStringFactory);

const schema = {
    sendContact: joiExtended.object().keys({
        wa_id: joiExtended.string().phoneNumber().required(),
        contacts: joiExtended.array().min(1).items(
            joiExtended.object().keys({
                name: joiExtended.object().keys({
                    formatted_name: joiExtended.string().min(1).max(20).required()
                }).required(),
                org: joiExtended.object().keys({
                    department: joiExtended.string().min(1).max(20),
                    title: joiExtended.string().min(1).max(20),
                    company: joiExtended.string().min(1).max(20)
                }),
                emails: joiExtended.array().min(1).items(
                    joiExtended.object().keys({
                        email: joiExtended.string().min(1).max(100).required(),
                        type: joiExtended.string().valid('HOME', 'WORK').insensitive().uppercase().required()
                    })
                ),
                phones: joiExtended.array().min(1).items(
                    joiExtended.object().keys({
                        phone: joiExtended.string().phoneNumber().required(),
                        type: joiExtended.string().valid('CELL', 'HOME', 'IPHONE', 'MAIN', 'WORK').insensitive().uppercase().required()
                    })
                ).required(),
                birthday: joiExtended.date().format('YYYY-MM-DD').raw(),
                addresses: joiExtended.array().min(1).items(
                    joiExtended.object().keys({
                        street: joiExtended.string().min(1).max(50),
                        city: joiExtended.string().min(1).max(30),
                        state: joiExtended.string().min(1).max(10),
                        zip: joiExtended.string().min(1).max(8),
                        country: joiExtended.string().min(1).max(20),
                        country_code: joiExtended.string().min(1).max(5),
                        type: joiExtended.string().valid('HOME', 'WORK').insensitive().uppercase().required()
                    })
                ),
                urls: joiExtended.array().min(1).items(
                    joiExtended.object().keys({
                        url: joiExtended.string().uri().required(),
                        type: joiExtended.string().valid('HOME', 'WORK').insensitive().uppercase().required()
                    })
                )
            })
        ).required()
    }),

    sendLocation: joiExtended.object().keys({
        wa_id: joiExtended.string().phoneNumber().required(),
        latitude: joiExtended.number().required(),
        longitude: joiExtended.number().required(),
        name: joiExtended.string().min(1),
        address: joiExtended.string().min(1)
    }),

    sendMedia: joiExtended.object().keys({
        wa_id: joiExtended.string().phoneNumber().required(),
        type: joiExtended.string().valid('audio', 'document', 'image', 'video').insensitive().lowercase().required(),
        link: joiExtended.string().uri().required(),
        caption: joiExtended.any().when('type', {
            is: joiExtended.string().valid('document', 'image', 'video'),
            then: joiExtended.string().min(1).max(1024),
            otherwise: joiExtended.strip()
        }),
        filename: joiExtended.any().when('type', {
            is: joiExtended.string().valid('document'),
            then: joiExtended.string().min(1),
            otherwise: joiExtended.strip()
        })
    }),

    sendReplyButton: joiExtended.object().keys({
        wa_id: joiExtended.string().phoneNumber().required(),
        header: joiExtended.object().keys({
            type: joiExtended.string().valid('image', 'text').insensitive().lowercase().required(),
            text: joiExtended.any().when('type', {
                is: joiExtended.string().valid('text'),
                then: joiExtended.string().min(1).max(60).required(),
                otherwise: joiExtended.strip()
            }),
            link: joiExtended.any().when('type', {
                is: joiExtended.string().valid('image'),
                then: joiExtended.string().uri().required(),
                otherwise: joiExtended.strip()
            })
        }),
        body: joiExtended.string().min(1).max(1024).required(),
        footer: joiExtended.string().min(1).max(60),
        action: joiExtended.object().keys({
            buttons: joiExtended.array().min(1).max(3).items(
                joiExtended.object().keys({
                    id: joiExtended.string().min(1).max(256).required(),
                    title: joiExtended.string().min(1).max(20).required()
                })
            ).required()
        }).required()
    }),

    sendReplyList: joiExtended.object().keys({
        wa_id: joiExtended.string().phoneNumber().required(),
        header: joiExtended.object().keys({
            type: joiExtended.string().valid('text').insensitive().lowercase().required(),
            text: joiExtended.string().min(1).max(60).required()
        }),
        body: joiExtended.string().min(1).max(1024).required(),
        footer: joiExtended.string().min(1).max(60),
        action: joiExtended.object().keys({
            button: joiExtended.string().min(1).max(20).required(),
            sections: joiExtended.array().length(1).items(
                joiExtended.object().keys({
                    rows: joiExtended.array().min(1).max(10).items(
                        joiExtended.object().keys({
                            id: joiExtended.string().min(1).max(200).required(),
                            title: joiExtended.string().min(1).max(24).required(),
                            description: joiExtended.string().min(1).max(72)
                        })
                    ).unique('id').required()
                })
            ).unique((a, b) => {
                return a.rows.some((item1) => b.rows.some((item2) => item1.id === item2.id));
            }).required()
        }).required()
    }),

    sendTemplate: joiExtended.object().keys({
        wa_id: joiExtended.string().phoneNumber().required(),
        template_id: joiExtended.number().min(1).required(),
        components: joiExtended.array().items(
            joiExtended.object({
                type: joiExtended.string().valid('header').insensitive().lowercase(),
                parameters: joiExtended.array().items(
                    joiExtended.object({
                        type: joiExtended.string().valid('document', 'image', 'text', 'video').insensitive().lowercase().required(),
                        document: joiExtended.any().when('type', {
                            is: joiExtended.string().valid('document'),
                            then: joiExtended.object().keys({
                                link: joiExtended.string().uri().required(),
                                filename: joiExtended.string().min(1)
                            }).required(),
                            otherwise: joiExtended.strip()
                        }),
                        image: joiExtended.any().when('type', {
                            is: joiExtended.string().valid('image'),
                            then: joiExtended.object().keys({
                                link: joiExtended.string().uri().required()
                            }).required(),
                            otherwise: joiExtended.strip()
                        }),
                        text: joiExtended.any().when('type', {
                            is: joiExtended.string().valid('text'),
                            then: joiExtended.string().min(1).required(),
                            otherwise: joiExtended.strip()
                        }),
                        video: joiExtended.any().when('type', {
                            is: joiExtended.string().valid('video'),
                            then: joiExtended.object().keys({
                                link: joiExtended.string().uri().required()
                            }).required(),
                            otherwise: joiExtended.strip()
                        })
                    })
                )
            }),
            joiExtended.object({
                type: joiExtended.string().valid('body').insensitive().lowercase().required(),
                parameters: joiExtended.array().items(
                    joiExtended.object({
                        type: joiExtended.string().valid('text').insensitive().lowercase().required(),
                        text: joiExtended.string().required()
                    })
                )
            }),
            joiExtended.object({
                type: joiExtended.string().valid('carousel').insensitive().lowercase().required(),
                cards: joiExtended.array().max(10).items(
                    joiExtended.object({
                        card_index: joiExtended.number().integer().min(0).required(),
                        components: joiExtended.array().items(
                            joiExtended.object({
                                type: joiExtended.string().valid('header').insensitive().lowercase().required(),
                                parameters: joiExtended.array().length(1).items(
                                    joiExtended.object({
                                        type: joiExtended.string().valid('image', 'video').insensitive().lowercase().required(),
                                        image: joiExtended.any().when('type', {
                                            is: joiExtended.string().valid('image'),
                                            then: joiExtended.object().keys({
                                                link: joiExtended.string().uri().required()
                                            }).required(),
                                            otherwise: joiExtended.strip()
                                        }),
                                        video: joiExtended.any().when('type', {
                                            is: joiExtended.string().valid('video'),
                                            then: joiExtended.object().keys({
                                                link: joiExtended.string().uri().required()
                                            }).required(),
                                            otherwise: joiExtended.strip()
                                        })
                                    })
                                ).required()
                            }).required(),
                            joiExtended.object({
                                type: joiExtended.string().valid('button').insensitive().lowercase().required(),
                                sub_type: joiExtended.string().valid('quick_reply').insensitive().lowercase().required(),
                                index: joiExtended.number().integer().min(0).required(),
                                parameters: joiExtended.array().length(1).items(
                                    joiExtended.object({
                                        type: joiExtended.string().valid('payload').insensitive().lowercase().required(),
                                        payload: joiExtended.string().required()
                                    })
                                ).required()
                            }).required(),
                            joiExtended.object({
                                type: joiExtended.string().valid('button').insensitive().lowercase().required(),
                                sub_type: joiExtended.string().valid('url').insensitive().lowercase().required(),
                                index: joiExtended.number().integer().min(0).required(),
                                parameters: joiExtended.array().length(1).items(
                                    joiExtended.object({
                                        type: joiExtended.string().valid('text').insensitive().lowercase().required(),
                                        text: joiExtended.string().required()
                                    })
                                ).required()
                            })
                        ).required()
                    }).required()
                ).required()
            }),
            joiExtended.object({
                type: joiExtended.string().valid('button').insensitive().lowercase().required(),
                sub_type: joiExtended.string().valid('otp').insensitive().lowercase().required(),
                parameters: joiExtended.array().length(1).items(
                    joiExtended.object({
                        type: joiExtended.string().valid('text').insensitive().lowercase().required(),
                        text: joiExtended.string().min(1).max(15).required()
                    })
                ).required()
            })
        )
    }),

    sendText: joiExtended.object().keys({
        wa_id: joiExtended.string().phoneNumber().required(),
        text: joiExtended.string().min(1).max(4096).required()
    })
};

module.exports = schema;
