const { DynamoDB } = require('aws-sdk');
const sls = require('serverless-http');
const express = require('express');
const userSchema = require('../schemas/user');
const validateRequest = require('../middlewares/validateRequest');
const errorHandler = require('../middlewares/errorHandler');
const CustomError = require('../responses/errors/CustomError');
const CustomResponse = require('../responses/CustomResponse');

const db = new DynamoDB.DocumentClient();
const UsersTable = process.env.USERS_TABLE;

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

usersAPI.post(
  '/user',
  validateRequest(userSchema.userPost, 'body'),
  async (req, res, next) => {
    const user = {
      userId: req.body.userId,
      username: req.body.username,
      givenName: req.body.givenName,
      familyName: req.body.familyName,
      email: req.body.email,
      role: req.body.role,
    };
    try {
      await db
        .put({
          TableName: UsersTable,
          Item: user,
        })
        .promise();
      const customResponse = new CustomResponse(201, user);
      return res.status(201).send(customResponse.serializeResponse());
    } catch (err) {
      return next(err);
    }
  }
);

usersAPI.get(
  '/user/:userId',
  validateRequest(userSchema.userGetById, 'params'),
  async (req, res, next) => {
    try {
      const dbResult = await db
        .get({
          TableName: UsersTable,
          Key: {
            userId: req.params.userId,
          },
        })
        .promise();
      if (!dbResult.Item) {
        throw new CustomError(404, 'User not found');
      }
      const customResponse = new CustomResponse(200, dbResult.Item);
      return res.status(200).send(customResponse.serializeResponse());
    } catch (err) {
      return next(err);
    }
  }
);

usersAPI.use(errorHandler);

module.exports.handler = sls(usersAPI);
