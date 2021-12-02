const sls = require('serverless-http');
const express = require('express');
const initializeConnection = require('./common');

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

violationsAPI.post('/violations', async (req, res) => {
  const con = initializeConnection();
  //const data = req.body;

  try {
    console.log("violations post");
    console.log("req: " + req);
    console.log("req.body.body.violations");
    console.log(req.body.body);

    const data = req.body.body.violations;

    await Promise.all(
      data.map(async (violation) => {
        const result = await con.query(
          `Insert into \`database-1\`.\`Violations\` (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('${violation.userId}', '${violation.repoId}', '${violation.prId}', '${violation.filePath}', '${violation.lineNumber}', '${violation.ruleId}', '${violation.prTime}', '${violation.dateFound}')`
        );
        //console.log({ result });
        console.log("inserted violation");
      })
    );
    console.log("before end");
    con.end();
    console.log("after end");
    return res.status(200).send(data);
  } catch (err) {
    console.log("error");
    console.log({ err });
    con.end();
    return res.status(500).send(err);
  }
});

violationsAPI.get('/violations', async (req, res) => {
  console.log("/violations get");
  const con = initializeConnection();
  try {
    const [rows, _] = await con.query(
      'select v.violationId, r.ruleId, u.username, v.repoId, v.prId, v.filePath, v.lineNumber, r.severity, r.violationCategory, r.content, v.prTime, v.dateFound from `database-1`.`Rules` r, `database-1`.`Violations` v, `database-1`.`Users` u where r.ruleId = v.ruleId and u.userId = v.userId'
    );
    console.log("/violations get -- return");
    console.log({ rows });
    con.end();
    return res.status(200).send(rows);
  } catch (err) {
    console.log({ err });
    con.end();
    return res.status(500).send(err);
  }
});

violationsAPI.get('/violations/repo', async (req, res) => {
  console.log("/violations get repo");
  const con = initializeConnection();
  try {
    const [rows, _] = await con.query(
      'select count(*) as numOfViolations, repoId FROM `database-1`.`Violations` GROUP BY repoId'
    );
    console.log("/violations get repo -- return");
    console.log({ rows });
    con.end();
    return res.status(200).send(rows);
  } catch (err) {
    console.log({ err });
    con.end();
    return res.status(500).send(err);
  }
});

violationsAPI.get('/violations/type', async (req, res, next) => {
  console.log("/violations get type");
  const con = initializeConnection();
  try {
    const [rows, _] = await con.query(
      'select count(*) as numOfViolation, r.violationCategory from `database-1`.`Rules` r, `database-1`.`Violations` v where r.ruleId = v.ruleId group by r.violationCategory'
    );
    console.log("/violations get type --return");
    console.log({ rows });
    con.end();
    return res.status(200).send(rows);
  } catch (err) {
    console.log({ err });
    con.end();
    return res.status(500).send(err);
  }
});

violationsAPI.get('/violations/user/type', async (req, res) => {
  console.log("/violations/user/type get");
  const con = initializeConnection();
  try {
    const [rows, _] = await con.query(
      'select count(1) as numOfViolation, u.username, r.violationCategory from `database-1`.`Rules` r, `database-1`.`Violations` v, `database-1`.`Users` u where r.ruleId = v.ruleId and v.userId = u.userId group by v.userId, r.violationCategory'
    );
    console.log("/violations/user/type get -- return");
    console.log({ rows });
    con.end();
    return res.status(200).send(rows);
  } catch (err) {
    console.log({ err });
    con.end();
    return res.status(500).send(err);
  }
});

violationsAPI.get('/violations/user/:userId', async (req, res, next) => {
  console.log("/violations/user/userId get");
  const con = initializeConnection();
  try {
    const [rows, _] = await con.query(
      `select v.violationId, r.ruleId, u.username, v.repoId, v.prId, v.filePath, v.lineNumber, r.severity, r.violationCategory, r.content, v.prTime, v.dateFound from \`database-1\`.\`Rules\` r, \`database-1\`.\`Violations\` v, \`database-1\`.\`Users\` u where r.ruleId = v.ruleId and v.userId='${req.params.userId}' and u.userId='${req.params.userId}'`
    );
    console.log("/violations/user/userId get -- return");
    console.log({ rows });
    con.end();
    return res.status(200).send(rows);
  } catch (err) {
    console.log({ err });
    con.end();
    return res.status(500).send(err);
  }
});

module.exports.handler = sls(violationsAPI);
