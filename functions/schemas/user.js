const Joi = require('joi');

const userPost = Joi.object({
  googleId: Joi.string().min(1).max(50).required(),
  username: Joi.string().min(1).max(50).required(),
  givenName: Joi.string().min(1).max(50).required(),
  familyName: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'base').required(),
});

const userGetByGoogleId = Joi.object({
  googleId: Joi.string().min(1).max(50).required()
});

// const userGetByUsername = Joi.object({
//   username: Joi.string().min(1).max(50).required(),
// });

module.exports = { userPost, userGetByGoogleId };
