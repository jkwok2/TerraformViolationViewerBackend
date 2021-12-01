const sls = require('serverless-http');
const express = require('express');
const ruleSchema = require('../schemas/rule');
const validateRequest = require('../middlewares/validateRequest');
const errorHandler = require('../middlewares/errorHandler');
// const initializeConnection = require('./common');
const connection = require('./common');

const rulesAPI = express();
rulesAPI.use(express.json());

rulesAPI.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  next();
});

rulesAPI.get('/rules', async (req, res) => {
  // const con = initializeConnection();
  try {
    const rows = await connection.query('select * from `database-1`.`Rules`');
    console.log({ rows });
    await connection.quit();
    return res.status(200).send(rows);
  } catch (err) {
    console.log({ err });
    await connection.quit();
    return res.status(500).send(err);
  }
});

rulesAPI.patch(
  '/rules/:ruleId',
  validateRequest(ruleSchema.updateRuleById, 'params'),
  async (req, res) => {
    // const con = initializeConnection();
    let query;
    console.log('start: ', req.body, req.params);
    if (req.body.status) {
      console.log('status: ', req.body.status, req.params.ruleId);
      query = `update \`database-1\`.\`Rules\` set status='${req.body.status}' where ruleId='${req.params.ruleId}'`;
    } else if (req.body.severity) {
      console.log('severity: ', req.body.severity, req.params.ruleId);
      query = `update \`database-1\`.\`Rules\` set severity='${req.body.severity}' where ruleId='${req.params.ruleId}'`;
    } else {
      console.log('else: ', req.body, req.params);
      await connection.quit();
      return res.status(500).send({});
    }
    try {
      const rows = await connection.query(query);
      console.log({ rows });
      await connection.quit();
      return res.status(200).send(rows);
    } catch (err) {
      console.log({ err });
      await connection.quit();
      return res.status(500).send(err);
    }
  }
);

module.exports.handler = sls(rulesAPI);
