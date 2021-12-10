const sls = require('serverless-http');
const express = require('express');
const ruleSchema = require('../schemas/rule');
const validateRequest = require('../middlewares/validateRequest');
const errorHandler = require('../middlewares/errorHandler');
const multer = require('multer');
const upload = multer();
const YAML = require('yaml')
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

rulesAPI.post('/addRule', upload.any(), async (req, res) => {
  console.log(req);
  // const con = connection();
  for (let data of req.files) {
    console.log(data)
    let fileName = data.originalname;
    console.log(fileName);
    let contentStr = data.buffer.toString('utf8');
    console.log(contentStr)
    let dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log('parsing YAML');
    let yamlData = YAML.parse(contentStr);
    if (yamlData.resource === undefined) {
      connection.end();
      return res.status(400).send('no resource. invalid rule detected.')
    }
    let category = yamlData.category
    if (category === undefined) {
      category = 'Not Detected'
    }
    let ruleDescription = yamlData.description
    console.log(ruleDescription)
    try {
      await connection.query(`Insert into \`database-1\`.\`Rules\` (ruleId, fileId, awsresource, severity, violationCategory, status, description, dateAdded, content) values (null, '${fileName}', '${yamlData.resource}', '${yamlData.severity}', '${category}', 'active', '${ruleDescription}', '${dateTime}', '${contentStr}')`);
      console.log('file uploaded')
    } catch (err) {
      console.log('there is an error')
      console.log({ err });
      connection.end();
      return res.status(500).send(err);
    }
  }
  connection.end();
  return res.status(200).send('success! file(s) uploaded!');
});

module.exports.handler = sls(rulesAPI);
