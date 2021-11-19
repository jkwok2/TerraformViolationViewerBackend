'use strict';

const crypto = require('crypto');
const axios = require('axios');
const aws = require('aws-sdk');

const invokeLambda = require('functions/utilities/invokeLambda.js')

aws.config.region = process.region;
var lambda = new aws.Lambda();

const writeFileLambdaName = 'hsbc-backend-app-meg-dev-writeFile';
const readFileLambdaName = 'hsbc-backend-app-meg-dev-readFile';

// Change to tr for terraform
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
        'repo': body.pull_request.head.repo.name,
        'repo_owner': body.pull_request.head.repo.owner.login
        // 'changed_files_num': body.pull_request.changed_files
    }

    const fileUrls = await getFileUrls(pullRequest.url + '/files');
    const files = await getChangedFilesContent(fileUrls);
    // console.log(files);
    // call parsing lambda on each file in files

    // files.forEach(f => invokeWriteFileLambda(f.name, f.content, pullRequest.id, pullRequest.repo));

    const dir = '/mnt/files/' + pullRequest.pullRequestId;
    // const path = dir + "/" + event.filename;

    files.forEach(f => invokeLambda(writeFileLambdaName, {filename: f.name, 
                                                            content: f.content, 
                                                            pullRequestId: pullRequest.id, 
                                                            repoName: pullRequest.repo}));

    return callback(null, response);
};

async function getGithubUserEmail(username) {

    const email_url = 'https://api.github.com/users/' + username;
    return axios.get(email_url, {
        'headers': {
            'Authorization': `token ${process.env.GITHUB_AUTHENTICATION_TOKEN}`
        }
    }).then((res) => {
        return res.data.email;
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
        // console.log(res.data);
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