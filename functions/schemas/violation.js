const Joi = require('joi');

const violationSchema = Joi.object({
  violationId: Joi.number().integer().min(1).max(100).required(),
  ruleId: Joi.string().min(1).max(50).required(),
  repoId: Joi.string().min(1).max(45).required(),
  prId: Joi.number().min(1).max(45).required(),
  filePath: Joi.string().min(1).max(120).required(),
  lineNumber: Joi.number().min(1).max(45).required(),
  userId: Joi.string().min(1).max(45).required(),
  prTime: Joi.date().timestamp().required(),
  dateFound: Joi.date().required()
});

module.exports = violationSchema;
