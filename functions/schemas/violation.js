const Joi = require('joi');

const violationSchema = Joi.object({
  userId: Joi.string().min(1).max(50).required(),
  repoId: Joi.string().min(1).max(50).required(),
  prId: Joi.number().min(1).max(50).required(),
  filePath: Joi.string().min(1).max(250).required(),
  lineNumber: Joi.number().min(1).max(50).required(),
  violationType: Joi.string().min(1).max(50).required(),
  violationTime: Joi.date().timestamp().required(),
  dateFound: Joi.date().required()
});

module.exports = violationSchema;
