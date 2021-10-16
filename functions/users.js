const { DynamoDB } = require('aws-sdk');
const sls = require('serverless-http');
const express = require('express');


const db = new DynamoDB.DocumentClient();
const UsersTable = process.env.USERS_TABLE;

const usersAPI = express();
usersAPI.use(express.json());

usersAPI.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  next();
});

usersAPI.post('/user', async (req, res, next) => {
  const user = {
    googleId: req.body.googleId,
    username: req.body.username,
    givenName: req.body.givenName,
    familyName: req.body.familyName,
    email: req.body.email,
    role: req.body.role,
  };
  try {
      const dbResult = await db
          .put({
            TableName: UsersTable,
            Item: user,
          })
          .promise();
      console.log('successfully created user');
      console.log(dbResult);
      return res.status(201).send(user);
  } catch (err) {
    console.log('error in saving user');
    console.log(err);
    return res.status(500).send(err);
  }
});

usersAPI.get('/user/:googleId', async (req, res, next) => {
  try {
    const dbResult = await db
      .get({
        TableName: UsersTable,
        Key: {
          googleId: req.params.googleId,
        },
      })
      .promise();
    console.log('successfully found user');
    console.log(dbResult);
    return res.status(200).send(dbResult.Item);
  } catch (err) {
    console.log('error in getting user');
    console.log(err);
    return res.status(500).send(err);
  }
});

module.exports.handler = sls(usersAPI);
