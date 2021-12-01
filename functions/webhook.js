'use strict';

const crypto = require('crypto');
const axios = require('axios');
const aws = require('aws-sdk');
const fs = require('fs');

const invokeLambda = require('functions/utilities/invokeLambda.js');
const path = require('path');

aws.config.region = process.region;
var lambda = new aws.Lambda();

const writeFileLambdaName = 'hsbc-backend-app-meg-dev-writeFile';
const monitorLambdaName = 'hsbc-backend-app-meg-dev-monitor';
const parseFileLambdaName = 'hsbc-backend-app-meg-dev-parseFile';
const emailLambdaName = 'hsbc-backend-app-meg-dev-emailSender';

const fileType = '.tf';

module.exports.webhook = async (event, context, callback) => {

    validateGithubWebhookResponse(event);

    const response = {
        statusCode: 200,
        body: JSON.stringify({
            input: event,
        }),
    };

    let body = JSON.parse(event.body);
    console.log('action ' + body.action);
    // Only scan Terraform files when PR is created
    if (body.action !== 'opened' && body.action !== 'reopened') return callback(null, response);

    const pullRequest = {
        'id': body.pull_request.id,
        'number': body.number,
        'url': body.pull_request.url,
        'username': body.pull_request.user.login,
        'userid': body.pull_request.user.id,
        'repo': body.pull_request.head.repo.name,
        'repo_owner': body.pull_request.head.repo.owner.login,
        'timestamp': Date.parse(body.pull_request.updated_at)
    }

    console.log("timestamp: " + pullRequest.timestamp);
    console.log("body.pull_request.id: " + pullRequest.id);
    console.log("body.pull_request.user.id: " + pullRequest.userid); //body.pull_request.user.id);

    const fileUrls = await getFileUrls(pullRequest.url + '/files');
    const files = await getChangedFilesContent(fileUrls);
    const user = await getUserFromDB(pullRequest.username);
    console.log("user " + JSON.stringify(user));

    let promiseArray = [];
    files.forEach(f => promiseArray.push(invokeLambda(parseFileLambdaName, {fileName: f.name,
                                                            content: f.content,
                                                            path: f.path,
                                                            username: pullRequest.username,
                                                            userId: user.userId,
                                                            email: user.email,
                                                            prId: pullRequest.id, 
                                                            repoName: pullRequest.repo, 
                                                            prDate: pullRequest.timestamp})));


    // wait for all parseFileLambdas to return
    await Promise.all(promiseArray);
    // check database for results
    let tries = 0;
    let results = 0;
    while (tries < 10) {
        results = getResultsFromDB(pullRequest.timestamp);

        // checking if we have all the results
        if (results.length == files.length) {
            break;
        }
        tries++;
    }

    console.log(`results: ${results}`)

    let numViolations = 0;
    let statVal = "success";

    let emailPayload = {
        name: user.givenName,           // name of recipient
        address: user.email,
        statVal: statVal,        // pass/fail/error
        errCount: numViolations,       // number of violations
        repoName: pullRequest.repo        // name of pr repo
    }

    invokeLambda(emailLambdaName, emailPayload, 'Event');

    return callback(null, response);
};

async function getUserFromDB(username) {

    console.log(`requesting user info from database for ${username}`);
  
    const db_url = `https://juaqm4a9j6.execute-api.us-east-1.amazonaws.com/dev/users/?username=${username}`;
    console.log(db_url);

    return axios.get(db_url)
        .then((res) => {
            return res.data;
        }).catch((err) => {
            console.log("err " + err);
            return 105966689851359954303; // TODO: TA hardcoding ID to see if insertion works
        });
}

async function getResultsFromDB(updateTime) {

    console.log(`requesting results from database for ${updateTime}`);

    const db_url = `https://juaqm4a9j6.execute-api.us-east-1.amazonaws.com/dev/results/?prUpdateTime=${updateTime}`;
    console.log(db_url);

    return axios.get(db_url)
        .then((res) => {
            return res.data;
        }).catch((err) => {
            console.log("err " + err);
            return err;
        });
}

/*
Returns list of { name: String, path: String, content: base64 }
*/
async function getChangedFilesContent(urls) {

    let contents = [];
    urls.forEach(element => {
        const filename = element.filename;
        if (filename.substr(filename.length - 3) === fileType) {
            contents.push(getContent(element.contents_url));
        }
    });
    return axios.all(contents);
}

/*

{
    name: 'changedFile.text',
    path: 'changedFile.text',
    sha: '41c2670b3381b74c6f4c07db1a1531e77f85835a',
    size: 85,
    url: 'https://api.github.com/repos/CPSC-319/Group4Test/contents/changedFile.text?ref=5783394bbe9abd7ceb93c1271f49aa7bef91b64e',
    html_url: 'https://github.com/CPSC-319/Group4Test/blob/5783394bbe9abd7ceb93c1271f49aa7bef91b64e/changedFile.text',
    git_url: 'https://api.github.com/repos/CPSC-319/Group4Test/git/blobs/41c2670b3381b74c6f4c07db1a1531e77f85835a',
    download_url: 'https://raw.githubusercontent.com/CPSC-319/Group4Test/5783394bbe9abd7ceb93c1271f49aa7bef91b64e/changedFile.text?token=AD23Y4I66XRHWZJCQ2WZNCTBNM5M4',
    type: 'file',
    content: 'bGthamRzZjtsa3NhamZkO2xza2pmZAoKdHdvdHdvdHdvCjtsa2pkcztmbGtq\n' +
      'c2FkZgoKcHVzaHB1c2hwdXNoCgpzYWRmZHNhZgoKCmJsYWggYmxhaA==\n',
    encoding: 'base64',
    _links: {
      self: 'https://api.github.com/repos/CPSC-319/Group4Test/contents/changedFile.text?ref=5783394bbe9abd7ceb93c1271f49aa7bef91b64e',
      git: 'https://api.github.com/repos/CPSC-319/Group4Test/git/blobs/41c2670b3381b74c6f4c07db1a1531e77f85835a',
      html: 'https://github.com/CPSC-319/Group4Test/blob/5783394bbe9abd7ceb93c1271f49aa7bef91b64e/changedFile.text'
    }
  },
*/
function getContent(url) {

    return axios.get(url, {
        'headers': {
            'Authorization': `token ${process.env.GITHUB_AUTHENTICATION_TOKEN}`
        }
    }).then((res) => {
        console.log(res.data);
        return {
            'name': res.data.name,
            'path': res.data.path,
            'content': res.data.content
        };
    });
}

function getFileUrls(url) {
    return axios.get(url, {
        'headers': {
            'Authorization': `token ${process.env.GITHUB_AUTHENTICATION_TOKEN}`
        }
    }).then(res => res.data);
}

// code taken from https://github.com/serverless/examples/blob/master/aws-node-github-webhook-listener/handler.js
function validateGithubWebhookResponse(event) {
    
    var errMsg;
    const token = process.env.GITHUB_WEBHOOK_SECRET;
    const headers = event.headers;
    const sig = headers['X-Hub-Signature'];
    const githubEvent = headers['X-GitHub-Event'];
    const id = headers['X-GitHub-Delivery'];
    const calculatedSig = signRequestBody(token, event.body);

    if (typeof token !== 'string') {
        errMsg = 'Must provide a \'GITHUB_WEBHOOK_SECRET\' env variable';
        return callback(null, {
            statusCode: 401,
            headers: { 'Content-Type': 'text/plain' },
            body: errMsg,
        });
    }

    if (!sig) {
        errMsg = 'No X-Hub-Signature found on request';
        return callback(null, {
            statusCode: 401,
            headers: { 'Content-Type': 'text/plain' },
            body: errMsg,
        });
    }

    if (!githubEvent) {
        errMsg = 'No X-Github-Event found on request';
        return callback(null, {
            statusCode: 422,
            headers: { 'Content-Type': 'text/plain' },
            body: errMsg,
        });
    }

    if (!id) {
        errMsg = 'No X-Github-Delivery found on request';
        return callback(null, {
            statusCode: 401,
            headers: { 'Content-Type': 'text/plain' },
            body: errMsg,
        });
    }

    if (sig !== calculatedSig) {
        errMsg = 'X-Hub-Signature incorrect. Github webhook token doesn\'t match';
        return callback(null, {
            statusCode: 401,
            headers: { 'Content-Type': 'text/plain' },
            body: errMsg,
        });
    }
}

function signRequestBody(key, body) {
    return `sha1=${crypto.createHmac('sha1', key).update(body, 'utf-8').digest('hex')}`;
}