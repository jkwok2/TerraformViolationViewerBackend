const sls = require('serverless-http');
const express = require('express');
const userSchema = require('../schemas/user');
const validateRequest = require('../middlewares/validateRequest');
const errorHandler = require('../middlewares/errorHandler');
const CustomError = require('../responses/errors/CustomError');
const CustomResponse = require('../responses/CustomResponse');
const mysql = require('mysql');
const initializeConnection = require('./common');

const usersAPI = express();
usersAPI.use(express.json());

usersAPI.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  next();
});

usersAPI.get(
  '/users/:userId',
  validateRequest(userSchema.userGetById, 'params'),
  async (req, res, next) => {
    var con = initializeConnection();
    con.query(
      'select * from `database-1`.`Users` where userId=' + req.params.userId,
      function (error, result, fields) {
        if (error) {
          console.log({ error });
          con.end();
          return res.status(500).send(error);
        }
        if (result) {
          console.log({ result });
          con.end();
          return res.status(200).send(result);
        }
      }
    );
  }
);

usersAPI.use(errorHandler);

module.exports.handler = sls(usersAPI);
