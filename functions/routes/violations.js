const { DynamoDB } = require('aws-sdk');
const sls = require('serverless-http');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const db = new DynamoDB.DocumentClient();
const ViolationsTable = process.env.VIOLATIONS_TABLE;

const violationsAPI = express();
violationsAPI.use(express.json());

violationsAPI.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  next();
});

violationsAPI.post('/violation', async (req, res, next) => {
  const violationId = uuidv4();
  const userId = 'xyz'; // todo: get this from the frontend request
  const violation = {
    id: violationId,
    userId,
    repoId: req.body.repoId,
    prId: req.body.prId,
    filePath: req.body.filePath,
    lineNumber: req.body.lineNumber,
    type: req.body.type,
    timestamp: new Date().toISOString(),
  };
  try {
    const dbResult = await db
      .put({
        TableName: ViolationsTable,
        Item: violation,
      })
      .promise();
    console.log('successfully created violation');
    console.log(dbResult);
    return res.status(201).send(violation);
  } catch (err) {
    console.log('error in saving violation');
    console.log(err);
    return res.status(500).send(err);
  }
});

violationsAPI.get('/violation', async (req, res, next) => {
  const userId = req.query.userId;
  console.log('userid from request: ', userId);
  try {
    const dbResult = await db
      .query({
        TableName: ViolationsTable,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :user_id',
        ExpressionAttributeValues: {
          ':user_id': userId,
        },
      })
      .promise();
    console.log('found user violations: ', dbResult);
    return res.status(200).send(dbResult);
  } catch (err) {
    console.log('error in finding user violations: ', err);
    return next(err);
  }
});

module.exports.handler = sls(violationsAPI);
