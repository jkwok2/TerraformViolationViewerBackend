const Joi = require('joi');

const userPost = Joi.object({
  userId: Joi.string().min(1).max(45).required(),
  username: Joi.string().min(1).max(45),
  givenName: Joi.string().min(1).max(50).required(),
  familyName: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().min(1).max(90).required(),
  userRole: Joi.string().min(1).max(90).valid('admin', 'base'),
});

const userGetById = Joi.object({
  userId: Joi.string().min(1).max(50).required(),
});

module.exports = { userPost, userGetById };
