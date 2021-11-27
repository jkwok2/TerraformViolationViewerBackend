const sls = require('serverless-http');
const express = require('express');
const userSchema = require('../schemas/user');
const validateRequest = require('../middlewares/validateRequest');
const errorHandler = require('../middlewares/errorHandler');
const initializeConnection = require('./common');

const usersAPI = express();
usersAPI.use(express.json());

usersAPI.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  next();
});

usersAPI.post(
  '/users',
  validateRequest(userSchema.userPost),
  async (req, res) => {
    const con = initializeConnection();
    try {
      const [rows, _] = await con.query(
        `select * from \`database-1\`.\`Users\` where userId='${req.body.userId}'`
      );
      if (rows && rows.length !== 0) {
        con.end();
        return res.status(200).send(rows[0]);
      } else {
        const [rows, _] = await con.query(
          `Insert into \`database-1\`.\`Users\` (userId, email, givenName, familyName, userRole) values ('${req.body.userId}', '${req.body.email}', '${req.body.givenName}', '${req.body.familyName}', '${req.body.userRole}')`
        );
        console.log({ rows });
        con.end();
        return res.status(200).send(rows);
      }
    } catch (err) {
      console.log({ err });
      con.end();
      return res.status(500).send(err);
    }
  }
);

usersAPI.patch(
  '/users/:userId',
  validateRequest(userSchema.userUpdateById, 'params'),
  async (req, res) => {
    const con = initializeConnection();
    try {
      const [rows, _] = await con.query(
        `update \`database-1\`.\`Users\` set username='${req.body.username}' where userId='${req.params.userId}'`
      );
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

usersAPI.get('/users/', async (req, res) => {
  const con = initializeConnection();
  const uname = req.query.username;
  const uid = req.query.userId;
  let query;
  if (uname) {
    query = 'select * from `database-1`.`Users` where username="' + uname + '"';
  } else if (uid) {
    query = 'select * from `database-1`.`Users` where userId="' + uid + '"';
  } else {
    con.end();
    return res.status(500).send({});
  }
  try {
    const [rows, _] = await con.query(query);
    console.log({ rows });
    con.end();
    return res.status(200).send(rows[0]);
  } catch (err) {
    console.log({ err });
    con.end();
    return res.status(500).send(err);
  }
});

usersAPI.use(errorHandler);

module.exports.handler = sls(usersAPI);
