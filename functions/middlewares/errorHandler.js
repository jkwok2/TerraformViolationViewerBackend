const CustomError = require('../responses/errors/CustomError');

const errorHandler = (err, req, res, next) => {
  if (err instanceof CustomError) {
    res.status(err.statusCode).send(err.serializeResponse());
  } else {
    res.status(400).send({ status: 400, error: 'Something went wrong!' });
  }
};

module.exports = errorHandler;
