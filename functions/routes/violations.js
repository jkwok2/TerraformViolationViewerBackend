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
  let violationsAdded = 0;
  const data = req.body;

  data.forEach((violation, index) => {
    con.query(
      `Insert into \`database-1\`.\`Violations\` (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('${violation.userId}', '${violation.repoId}', '${violation.prId}', '${violation.filePath}', '${violation.lineNumber}', '${violation.ruleId}', '${violation.prTime}', '${violation.dateFound}')`,
      function (err, result) {
        if (err) {
          console.log({ err });
          con.end();
          return res.status(500).send(err);
        }
        if (result) {
          console.log({ result });
          violationsAdded++;
          if (violationsAdded === data.length) {
            console.log('ending connection');
            con.end();
            return res.status(200).send(data);
          }
        }
      }
    );
  });
});

violationsAPI.get('/violations', async (req, res) => {
  const con = initializeConnection();
  con.query(
    'select v.violationId, r.ruleId, u.username, v.repoId, v.prId, v.filePath, v.lineNumber, r.severity, r.violationCategory, v.prTime, v.dateFound from `database-1`.`Rules` r, `database-1`.`Violations` v, `database-1`.`Users` u where r.ruleId = v.ruleId and u.userId = v.userId',
    function (error, result) {
      if (error) {
        console.log({ error });
        con.end();
        return res.status(500).send(error);
      }
      if (result) {
        console.log({ result });
        return res.status(200).send(result);
      }
    }
  );
});

violationsAPI.get('/violations/repo', async (req, res) => {
  const con = initializeConnection();
  con.query(
    'select count(*) as numOfViolations, repoId FROM `database-1`.`Violations` GROUP BY repoId',
    function (error, result) {
      if (error) {
        console.log({ error });
        con.end();
        return res.status(500).send(error);
      }
      if (result) {
        console.log({ result });
        return res.status(200).send(result);
      }
    }
  );
});

violationsAPI.get('/violations/type', async (req, res, next) => {
  const con = initializeConnection();
  con.query(
    'select count(*) as numOfViolation, r.violationCategory from `database-1`.`Rules` r, `database-1`.`Violations` v where r.ruleId = v.ruleId group by r.violationCategory',
    function (error, result) {
      if (error) {
        console.log({ error });
        con.end();
        return res.status(500).send(error);
      }
      if (result) {
        console.log({ result });
        return res.status(200).send(result);
      }
    }
  );
});

violationsAPI.get('/violations/user/type', async (req, res) => {
  const con = initializeConnection();
  con.query(
    'select count(1) as numOfViolation, v.username, r.violationCategory from `database-1`.`Rules` r, `database-1`.`Violations` v where r.ruleId = v.ruleId group by v.username, r.violationCategory',
    function (error, result) {
      if (error) {
        console.log({ error });
        con.end();
        return res.status(500).send(error);
      }
      if (result) {
        console.log({ result });
        return res.status(200).send(result);
      }
    }
  );
});

violationsAPI.get('/violations/user/:userId', async (req, res, next) => {
  const con = initializeConnection();
  console.log(req.params.userId);
  con.query(
    `SELECT u.username FROM \`database-1\`.\`Violations\` v, \`database-1\`.\`Users\` u WHERE v.userId='${req.params.userId}' and u.userId='${req.params.userId}'`,
    function (error, result) {
      if (error) {
        console.log({ error });
        con.end();
        return res.status(500).send(error);
      }
      if (result) {
        console.log({ result });
        return res.status(200).send(result);
      }
    }
  );
});

module.exports.handler = sls(violationsAPI);
