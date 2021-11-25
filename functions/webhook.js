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
        'userid': body.pull_request.user.id,
        'repo': body.pull_request.head.repo.name,
        'repo_owner': body.pull_request.head.repo.owner.login,
        //TODO use this 'timestamp': body.pull_request.updated_at
        'timestamp': Date.parse(body.pull_request.updated_at)
        // 'changed_files_num': body.pull_request.changed_files
    }

    console.log("timestamp: " + pullRequest.timestamp);
    console.log("body.pull_request.id: " + pullRequest.id);
    console.log("body.pull_request.user.id: " + body.pull_request.user.id);

    const fileUrls = await getFileUrls(pullRequest.url + '/files');
    const files = await getChangedFilesContent(fileUrls);
    // console.log(files);
    // call parsing lambda on each file in files

    // files.forEach(f => invokeWriteFileLambda(f.name, f.content, pullRequest.id, pullRequest.repo));

    const efsPath = '/mnt/files/' + pullRequest.repo + pullRequest.timestamp;
    // const path = dir + "/" + event.filename;
    console.log("efsPath: " + efsPath);


    var metadataPayload = {username: pullRequest.username, 
                        timestamp: pullRequest.timestamp, 
                        repo: pullRequest.repo, 
                        path: efsPath, 
                        originalPaths: []};

    files.forEach(f => metadataPayload.originalPaths.push(efsPath + f.name));


    console.log(metadataPayload.originalPaths[0]);

    // creates metadata file in dir for this PR
    invokeLambda(writeFileLambdaName, {fileName: "metadata.json", 
                                        content: metadataPayload, 
                                        dir: efsPath });

    files.forEach(f => invokeLambda(writeFileLambdaName, {fileName: f.name, 
                                                            content: f.content, 
                                                            dir: efsPath, 
                                                            pullRequestId: pullRequest.id}));

    files.forEach(f => invokeLambda(parseFileLambdaName, {fileName: f.name, 
                                                            dir: efsPath,
                                                            efsFilePath: efsPath + "/" + f.name, 
                                                            githubFullPath: f.path}));

    const monitorPayload = { username: pullRequest.username, 
                                userid: pullRequest.userid, 
                                repoName: pullRequest.repo,
                                dir: efsPath, 
                                numFiles: files.length * 2 + 1}  // parseFile creates duplicate for each file, plus metadatafile

    var numFiles = files.length;
    var newNumFiles = numFiles * 2 + 1;

    console.log("file.length: " +  numFiles);
    console.log("file.length * 2 + 1: " +  newNumFiles);

    await new Promise(resolve => setTimeout(resolve, 2000));

    invokeLambda(monitorLambdaName, monitorPayload);

    console.log(monitorPayload);

    return callback(null, response);
};

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