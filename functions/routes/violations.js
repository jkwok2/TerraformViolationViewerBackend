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

// violationsAPI.post('/violations', async (req, res) => {
//   const con = initializeConnection();
//   const data = req.body;
//   con.query(
//     `Insert into \`database-1\`.\`Violations\` (username, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ?`,
//     [data],
//     function (err, result) {
//       if (err) {
//         console.log({ err });
//         con.end();
//         return res.status(500).send(err);
//       }
//       if (result) {
//         console.log({ result });
//         con.end();
//         return res.status(200).send(result);
//       }
//     }
//   );
// });

violationsAPI.post('/violations', async (req, res) => {
  const con = initializeConnection();
  const violationsAdded = 0;
  const data = req.body;
  data.forEach((violation, index) => {
    con.query(
      `Insert into \`database-1\`.\`Violations\` (username, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('${violation.username}', '${violation.repoId}', '${violation.prId}', '${violation.filePath}', '${violation.lineNumber}', '${violation.ruleId}', '${violation.prTime}', '${violation.dateFound}')`,
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
    // "SELECT users.name AS user, products.name AS favorite FROM users JOIN products ON users.favorite_product = products.id"
    // select d.Name as DogName, o.Name
    // from Dog d
    // inner join Owner o on d.OwnerID = o.OwnerID
    'select * from `database-1`.`Violations`',
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
    'select v.repoId, v.violationType, count(1) as numOfViolations from `database-1`.`Violations` v group by v.repoId, v.violationType',
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
    'select COUNT(*) as numOfViolations, violationType FROM `database-1`.`Violations` GROUP BY violationType',
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
    'SELECT u.userId, u.username, v.violationType, count(1) as numOfViolations FROM `database-1`.`Violations` v, `database-1`.`Users` u WHERE v.userId = u.userId GROUP BY u.userId, u.username, v.violationType',
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
  con.query(
    'SELECT * FROM `database-1`.`Violations` WHERE userId=' + req.params.userId,
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
