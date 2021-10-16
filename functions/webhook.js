'use strict';

const crypto = require('crypto');
const axios = require('axios');

// Change to tr for terraform
const fileType = '.txt';

module.exports.webhook = async (event, context, callback) => {

    validateGithubWebhookResponse(event);

    let body = JSON.parse(event.body);

    // todo only continue if creating PR
    let action = body.action;

    const pullRequest = {
        'id': body.pull_request.id,
        'number': body.number,
        'url': body.pull_request.url,
        'username': body.pull_request.user.login,
        'repo': body.pull_request.head.repo.name,
        'repo_owner': body.pull_request.head.repo.owner.login
        // 'changed_files_num': body.pull_request.changed_files
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify({
            input: event,
        }),
    };

    const fileUrls = await getFileUrls(pullRequest.url + '/files');
    const files = await getChangedFilesContent(fileUrls);
    console.log(files);

    return callback(null, response);
};

async function getChangedFilesContent (urls) {

    let contents = [];
    console.log(urls);

    urls.forEach(element => { contents.push(getContent(element.contents_url)); });

    return axios.all(contents);
}

function getContent (url) {

    return axios.get(url, {
        'headers': {
            'Authorization': `token ${process.env.GITHUB_AUTHENTICATION_TOKEN}`
        }
    }).then (res => res.data);
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