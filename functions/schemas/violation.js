const Joi = require('joi');

const violationSchema = Joi.object({
  username: Joi.string().min(1).max(50).required(),
  repoId: Joi.string().min(1).max(50).required(),
  prId: Joi.number().required(),
  filePath: Joi.string().min(1).max(250).required(),
  lineNumber: Joi.number().required(),
  type: Joi.string().required(),
});

module.exports = violationSchema;
