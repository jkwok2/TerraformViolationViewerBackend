const sls = require('serverless-http');
const express = require('express');
const ruleSchema = require('../schemas/rule');
const validateRequest = require('../middlewares/validateRequest');
const errorHandler = require('../middlewares/errorHandler');
const initializeConnection = require('./common');
const multer = require('multer');
const upload = multer();
const YAML = require('yaml')

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
  const con = initializeConnection();
  try {
    const [rows, _] = await con.query('select * from `database-1`.`Rules`');
    console.log({ rows });
    con.end();
    return res.status(200).send(rows);
  } catch (err) {
    console.log({ err });
    con.end();
    return res.status(500).send(err);
  }
});

rulesAPI.patch(
  '/rules/:ruleId',
  validateRequest(ruleSchema.updateRuleById, 'params'),
  async (req, res) => {
    const con = initializeConnection();
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
      con.end();
      return res.status(500).send({});
    }
    try {
      const [rows, _] = await con.query(query);
      console.log({ rows });
      con.end();
      return res.status(200).send(rows);
    } catch (err) {
      console.log({ err });
      con.end();
      return res.status(500).send(err);
    }
  }
);

rulesAPI.post('/addRule', upload.any(), async (req, res) => {
  console.log(req);

  const con = initializeConnection();
  try {
    await Promise.all(
      req.files.map(async (file) => {
        let fileName = file.originalname;
        let contentStr = file.buffer.toString('utf8');
        console.log(contentStr)
        let dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        console.log('parsing YAML');
        let yamlData = YAML.parse(contentStr);
        let category = yamlData.category
        if (category === undefined) {
          category = 'Not Detected'
        }
        const [result, _ ] = await con.query(`Insert into \`database-1\`.\`Rules\` (ruleId, fileId, awsresource, severity, violationCategory, status, dateAdded, content) values (null, '${fileName}', '${yamlData.resource}', '${yamlData.severity}', '${category}', 'active', '${dateTime}', '${contentStr}')`);
        console.log({result})
      })
    )
    con.end()
    return res.status(200).send('success! file uploaded!');
  } catch (err) {
    console.log('there is an error')
    console.log({ err });
    con.end();
    return res.status(500).send(err);
}
  // }
  // // TODO: TA: technically, your front-end should always upload  a single file
  // // for (let data of req.files) {
  // //   console.log(req.files)
  // //   let fileName = data.originalname;
  // //   console.log(fileName);
  // //   let encoding = data.encoding;
  // //   console.log(encoding)
  // //   let type = data.mimetype;
  // //   console.log(type)
  // //   let contentStr = data.buffer.toString('utf8');
  // //   console.log(contentStr)
  // //   let dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

  //   // TODO: TA you need to have some try catch and check if the yamlData has the following fields:
  //   // awsresource
  //   // severity
  //   // category
  //   // etc.
  //   // If these fields are not available, then you should return a BAD REQUEST 400
  //   console.log('parsing YAML');
  //   let yamlData = YAML.parse(contentStr);
  //   let category = yamlData.category
  //   if (category === undefined) {
  //     category = 'Not Detected'
  //   }
  //   try {
  //     // con.query(`Insert into \`database-1\`.\`Rules\` (ruleId, fileId, awsresource, severity, violationCategoryA, status, dateAdded, content) values (null, '${fileName}', '${yamlData.resource}', '${yamlData.severity}', '${yamlData.category}', 'active', '${dateTime}',' '${contentStr}')`,
  //     await con.query(`Insert into \`database-1\`.\`Rules\` (ruleId, fileId, awsresource, severity, violationCategory, status, dateAdded, content) values (null, '${fileName}', '${yamlData.resource}', '${yamlData.severity}', '${category}', 'active', '${dateTime}', '${contentStr}')`
  //     );
  //     con.end();
  //     return res.status(200).send('success! file uploaded!');
  //   } catch (err) {
  //     console.log('there is an error')
  //     console.log({ err });
  //     con.end();
  //     return res.status(500).send(err);
  //   }
  // }
})

module.exports.handler = sls(rulesAPI);
