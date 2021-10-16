const Joi = require('joi');

const userPost = Joi.object({
  username: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().required(),
  role_name: Joi.string().valid('admin', 'base').required(),
});

const userGetByUsername = Joi.object({
  username: Joi.string().min(1).max(50).required(),
});

module.exports = { userPost, userGetByUsername };
