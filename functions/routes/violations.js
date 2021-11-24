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

violationsAPI.get('/violations', async (req, res) => {
    const con = initializeConnection();
    con.query(
        'select v.violationId, r.ruleId, v.username, v.repoId, v.prId, v.filePath, v.lineNumber, r.severity, r.violationCategory, v.prTime, v.dateFound from `database-1`.`Rules` r, `database-1`.`Violations` v where r.ruleId = v.ruleId',
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

violationsAPI.get('/violations/user/:username', async (req, res, next) => {
    const con = initializeConnection();
    console.log(req.params.username)
    con.query(
        'SELECT * FROM `database-1`.`Violations` WHERE userId=' + req.params.username ,
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
