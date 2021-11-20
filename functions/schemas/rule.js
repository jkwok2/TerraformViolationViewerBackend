const Joi = require('joi');

const ruleSchema = Joi.object({
    ruleId: Joi.string().min(1).max(50).required(),
    aws_resource_type: Joi.string().min(0).max(100),
    has: Joi.boolean(),
    has_key: Joi.string().min(0).max(100),
    has_value: Joi.string().min(0).max(100),
    has_range_beg: Joi.string().min(0).max(100),
    has_range_end: Joi.string().min(0).max(100),
    not_has: Joi.boolean(),
    not_has_key: Joi.string().min(0).max(100),
    not_has_value: Joi.string().min(0).max(100),
    not_has_range_beg: Joi.string().min(0).max(100),
    not_has_range_end: Joi.string().min(0).max(100),
});

module.exports = ruleSchema;