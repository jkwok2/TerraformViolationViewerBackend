const sls = require('serverless-http');
const express = require('express');
const initializeConnection = require('./common');

const resultsAPI = express();
resultsAPI.use(express.json());

resultsAPI.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  next();
});

resultsAPI.post('/results', async (req, res) => {
  const con = initializeConnection();

  try {
    console.log('posting results: ', req.body);

    const data = req.body.results;

    await Promise.all(
      data.map(async (prUpdateResult) => {
        const result = await con.query(
          `Insert into \`database-1\`.\`Results\` (prUpdateTime, numViolations, status) values ('${prUpdateResult.prUpdateTime}', '${prUpdateResult.numViolations}', '${prUpdateResult.status}')`
        );
        console.log('inserted result: ', result);
      })
    );
    con.end();
    return res.status(200).send(data);
  } catch (err) {
    console.log('results post error: ', err);
    con.end();
    return res.status(500).send(err);
  }
});

resultsAPI.get('/results/', async (req, res, next) => {
  const con = initializeConnection();
  const prUpdateTime = req.query.prUpdateTime;
  let query;
  if (prUpdateTime) {
    query =
      'select * from `database-1`.`Results` where prUpdateTime="' +
      prUpdateTime +
      '"';
  } else {
    query = 'select * from `database-1`.`Results`';
  }
  try {
    const [rows, _] = await con.query(query);
    console.log('get results: ', { rows });
    con.end();
    return res.status(200).send(rows);
  } catch (err) {
    console.log({ err });
    con.end();
    return res.status(500).send(err);
  }
});

module.exports.handler = sls(resultsAPI);
