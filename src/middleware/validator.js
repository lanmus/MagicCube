const Joi = require('joi');

const schemas = {
    createProduct: Joi.object({
        name: Joi.string().required(),
        spuCode: Joi.string().required(),
        gender: Joi.string().valid('male', 'female', 'unisex').required(),
        ageRange: Joi.string().required(),
        scene: Joi.string().required(),
        style: Joi.string().required(),
        designer3d: Joi.string().required(),
        designer2d: Joi.string().required(),
        modules: Joi.array().items(
            Joi.object({
                type: Joi.string().required(),
                subType: Joi.string().required(),
                name: Joi.string().required(),
                sortOrder: Joi.number().integer().min(0).required()
            })
        )
    }),

    updateProduct: Joi.object({
        name: Joi.string(),
        spuCode: Joi.string(),
        gender: Joi.string().valid('male', 'female', 'unisex'),
        ageRange: Joi.string(),
        scene: Joi.string(),
        style: Joi.string(),
        designer3d: Joi.string(),
        designer2d: Joi.string(),
        modules: Joi.array().items(
            Joi.object({
                type: Joi.string().required(),
                subType: Joi.string().required(),
                name: Joi.string().required(),
                sortOrder: Joi.number().integer().min(0).required()
            })
        )
    })
};

const validator = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];
        if (!schema) {
            return next(new Error(`Schema ${schemaName} not found`));
        }

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: '数据验证错误',
                details: error.details
            });
        }
        next();
    };
};

module.exports = validator; 