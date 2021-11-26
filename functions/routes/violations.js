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
    const data = req.body;
    console.log(data);
    con.query(
      `Insert into \`database-1\`.\`Violations\` (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values 
                    ('${req.body.userId}', '${req.body.repoId}', '${req.body.prId}', '${req.body.filePath}', '${req.body.lineNumber}', '${req.body.ruleId}', '${req.body.prTime}', '${req.body.dateFound}')`,
      //[data],
      function (err, result) {
        if (err) {
          console.log({ err });
          con.end();
          return res.status(500).send(err);
        }
        if (result) {
          console.log({ result });
          con.end();
          return res.status(200).send(result);
        }
      }
    );
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
        'select count(1) as numOfViolation, u.username, r.violationCategory from `database-1`.`Rules` r, `database-1`.`Violations` v, `database-1`.`Users` u where r.ruleId = v.ruleId and v.userId = u.userId group by v.userId, r.violationCategory',
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
        `select v.violationId, r.ruleId, u.username, v.repoId, v.prId, v.filePath, v.lineNumber, r.severity, r.violationCategory, v.prTime, v.dateFound from \`database-1\`.\`Rules\` r, \`database-1\`.\`Violations\` v, \`database-1\`.\`Users\` u where r.ruleId = v.ruleId and v.userId='${req.params.userId}' and u.userId='${req.params.userId}'`,
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
