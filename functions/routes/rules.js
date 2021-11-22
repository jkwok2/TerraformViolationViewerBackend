const sls = require('serverless-http');
const express = require('express');
const ruleSchema = require('../schemas/rule');
const validateRequest = require('../middlewares/validateRequest');
const errorHandler = require('../middlewares/errorHandler');
const initializeConnection = require('./common');

const rulesAPI = express();
rulesAPI.use(express.json());

rulesAPI.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE'
    );
    next();
});

rulesAPI.get('/rules', async (req, res) => {
    const con = initializeConnection();
    con.query(
        'select * from `database-1`.`Rules`',
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

rulesAPI.patch(
    '/rules/:ruleId',
    validateRequest(ruleSchema.updateRuleById, 'params'),
    async (req, res) => {
        const con = initializeConnection();
        con.query(
            `update \`database-1\`.\`Rules\` set status= '${req.body.status}' where ruleId= '${req.params.ruleId}'`,
            function (error, result) {
                if (error) {
                    console.log(req.body.status, req.params.ruleId);
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

module.exports.handler = sls(rulesAPI);