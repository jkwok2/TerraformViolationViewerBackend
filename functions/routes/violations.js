const sls = require('serverless-http');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql');
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

violationsAPI.get('/violations', async (req, res, next) => {
  var con = initializeConnection();
  con.query(
    'select * from `database-1`.`Violations`',
    function (error, result, fields) {
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

violationsAPI.get('/violations/repo', async (req, res, next) => {
  var con = initializeConnection();
  con.query(
    'SELECT COUNT(*), repoId FROM `database-1`.`Violations` GROUP BY repoId',
    function (error, result, fields) {
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
  var con = initializeConnection();
  con.query(
    'SELECT COUNT(*), violationType FROM `database-1`.`Violations` GROUP BY violationType',
    function (error, result, fields) {
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

violationsAPI.get('/violations/user/type', async (req, res, next) => {
  var con = initializeConnection();
  con.query(
    'SELECT *, COUNT(*), userId FROM `database-1`.`Violations` GROUP BY userId',
    function (error, result, fields) {
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
