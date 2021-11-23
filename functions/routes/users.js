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
        con.query('select * from `database-1`.`Users` where userId=' + req.body.userId, function(err, result) {
            if (err) {
                console.log({ err });
                con.end();
                return res.status(500).send(err);
            }
            if (result) {
                console.log('existing user!!!:')
                console.log({ result });
                if(result.length === 0) {
                    con.query(`Insert into \`database-1\`.\`Users\` (userId, email, givenName, familyName) values ('${req.body.userId}', '${req.body.email}', '${req.body.givenName}', '${req.body.familyName}')` ,
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
                con.end();
                return res.status(200).send(result);
            }
        })
    });

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

usersAPI.use(errorHandler);

module.exports.handler = sls(usersAPI);
