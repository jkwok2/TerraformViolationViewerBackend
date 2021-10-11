const Joi = require('joi');

const userSchema = Joi.object({
  username: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().required(),
  role_name: Joi.string().valid('admin', 'base').required(),
});

module.exports = userSchema;
