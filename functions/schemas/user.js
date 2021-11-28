const Joi = require('joi');

const userPost = Joi.object({
  userId: Joi.string().min(1).max(45).required(),
  username: Joi.string().min(1).max(45),
  email: Joi.string().email().min(1).max(90).required(),
  givenName: Joi.string().min(1).max(50).required(),
  familyName: Joi.string().min(1).max(50).required(),
  userRole: Joi.string().min(1).max(90).valid('admin', 'base'),
});

const userUpdateById = Joi.object({
  userId: Joi.string().min(1).max(50).required(),
});

module.exports = { userPost, userUpdateById};
