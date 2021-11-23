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

const con = initializeConnection();
con.query('SET GLOBAL connect_timeout=7200');
con.query('SET GLOBAL interactive_timeout=7200');
con.query('SET GLOBAL wait_timeout=7200');
con.end();


usersAPI.post(
    '/users',
    validateRequest(userSchema.userPost),
    async (req, res) => {
        const con = initializeConnection();
        con.query('select * from `database-1`.`Users` where userId=' + req.body.userId, function(err, result) {
            if (err) {
                console.log({ err });
                con.end();
                return res.status(500).send(err);
            }
            if (result && result.length !== 0) {
                con.end();
                return res.status(200).send(result);

            } else {
                con.query(`Insert into \`database-1\`.\`Users\` (userId, email, givenName, familyName, userRole) values ('${req.body.userId}', '${req.body.email}', '${req.body.givenName}', '${req.body.familyName}', '${req.body.userRole}')` ,
                    function(err, result) {
                        if (err) {
                            console.log({err});
                            con.end();
                            return res.status(500).send(err);
                        }
                        if (result) {
                            console.log({result});
                            con.end();
                            return res.status(200).send(result);
                        }
                    });
            }
        })
    });

usersAPI.patch(
    '/users/:userId',
    validateRequest(userSchema.userUpdateById, 'params'),
    async (req, res) => {
        const con = initializeConnection();
        console.log(req.body.username);
        console.log(req.params.userId);
        con.query(
            `update \`database-1\`.\`Users\` set username= '${req.body.username}' where userId= '${req.params.userId}'`,
            function (error, result) {
                if (error) {
                    console.log({ error });
                    con.end();
                    return res.status(500).send(error);
                }
                if (result) {
                    console.log({result});
                    con.end();
                    return res.status(200).send(result);
                }
            }
        );
    }
);

usersAPI.get(
    '/users/:userId',
    validateRequest(userSchema.userGetById, 'params'),
    async (req, res) => {
        const con = initializeConnection();
        con.query(
            'select * from `database-1`.`Users` where userId=' + req.params.userId,
            function (error, result) {
                if (error) {
                    console.log({ error });
                    con.end();
                    return res.status(500).send(error);
                }
                if (result) {
                    console.log({ result });
                    con.end();
                    return res.status(200).send(result);
                }
            }
        );
    }
);

usersAPI.get(
    '/users/:username',
    async (req, res) => {
        const con = initializeConnection();
        con.query(
            'select email from `database-1`.`Users` where username=' + req.params.username,
            function (error, result) {
                if (error) {
                    console.log({ error });
                    con.end();
                    return res.status(500).send(error);
                }
                if (result) {
                    console.log({ result });
                    con.end();
                    return res.status(200).send(result);
                }
            }
        );
    }
);


usersAPI.use(errorHandler);

module.exports.handler = sls(usersAPI);
