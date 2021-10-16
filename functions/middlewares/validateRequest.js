const Joi = require('joi');
const CustomError = require('../responses/errors/CustomError');

const validateRequestSchema = (schema, property) => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    const valid = error == null;

    if (valid) {
      next();
    } else {
      const { details } = error;
      const message = details.map((i) => i.message).join(',');
      throw new CustomError(422, message);
    }
  };
};

module.exports = validateRequestSchema;
