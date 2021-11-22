const Joi = require('joi');

const ruleSchema = Joi.object({
    ruleId: Joi.number().integer().min(1).max(50).required(),
    fileId: Joi.string().min(1).max(255).required(),
    aws_resource: Joi.string().min(1).max(90).required(),
    severity: Joi.string().min(1).max(45).required(),
    category: Joi.string().min(0).max(45).required(),
    description: Joi.string().min(0).max(255).required(),
    content: Joi.string().min(0).max(10000).required(),
    status: Joi.string().min(1).max(45),
    dateAdded: Joi.date().required()
});

const updateRuleById = Joi.object({
    ruleId: Joi.string().min(1).max(50).required(),
});

module.exports = { ruleSchema, updateRuleById };