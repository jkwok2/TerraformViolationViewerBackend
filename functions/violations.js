const { DynamoDB } = require('aws-sdk');
const sls = require('serverless-http');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const db = new DynamoDB.DocumentClient();
const ViolationsTable = process.env.VIOLATIONS_TABLE;

const violationsAPI = express();
violationsAPI.use(express.json());

violationsAPI.post('/violation', async (req, res, next) => {
  const violationId = uuidv4();
  const username = 'xyz'; // todo: get this from the frontend request
  const violation = {
    id: violationId,
    username,
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

violationsAPI.get('/violation/:id', async (req, res, next) => {
  try {
    const dbResult = await db
      .get({
        TableName: ViolationsTable,
        Key: {
          id: req.params.id,
        },
      })
      .promise();
    console.log('successfully found violation');
    console.log(dbResult);
    return res.status(200).send(dbResult.Item);
  } catch (err) {
    console.log('error in getting violation');
    console.log(err);
    return res.status(500).send(err);
  }
});

module.exports.handler = sls(violationsAPI);
