const Joi = require('joi');

const ruleSchema = Joi.object({
    ruleId: Joi.number().integer().min(1).max(100).required(),
    fileId: Joi.string().min(1).max(255).required(),
    awsresource: Joi.string().min(1).max(90).required(),
    severity: Joi.string().min(1).max(45).required(),
    violationCategory: Joi.string().min(0).max(45).required(),
    status: Joi.string().min(1).max(45),
    description: Joi.string().min(0).max(255).required(),
    dateAdded: Joi.date().required(),
    content: Joi.string().min(0).max(10000).required(),
});

const updateRuleById = Joi.object({
    ruleId: Joi.string().min(1).max(50).required(),
});

module.exports = { ruleSchema, updateRuleById };