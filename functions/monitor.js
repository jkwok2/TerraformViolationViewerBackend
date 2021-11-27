'use strict';

const aws = require('aws-sdk');
const fs = require('fs');
const axios = require('axios');

const invokeLambda = require('functions/utilities/invokeLambda.js');
const removeFile =  require('functions/utilities/removeFile.js')

const readFileLambdaName = 'hsbc-backend-app-meg-dev-readFile';
const emailLambdaName = 'hsbc-backend-app-meg-dev-emailSender';

module.exports.monitor = async (event, callback) => {

    sendViolationsToDB("test");
    
    // number of files to scan for pr
    const dir = event.dir;
    const numFiles = event.numFiles;
    var filesSoFar = [];

    var c = 0;

    while (filesSoFar.length < numFiles) {

        //check efs
        if (fs.existsSync(dir)) {
            filesSoFar = fs.readdirSync(dir);
            console.log("asdf");
            console.log("fileSoFar.length: " + filesSoFar.length);
        } else {
            console.log(dir + "doesn't exist");
        }

        c++;
        if (c > 10) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (c < 10) {
        console.log("have all files");
    } else {
        console.log("result files not found");
    }
    console.log(filesSoFar);

    console.log(filesSoFar[0]);
    const f = filesSoFar[1];

        var files = [];

        //const metadata = invokeLambda(readFileLambdaName, {fileName: "metadata.json", dir: event.dir }, 'RequestResponse');
        var metadata; 
        const metadataPath = dir + "/metadata.json";
        if (fs.existsSync(metadataPath)) {
            metadata = fs.readFileSync(metadataPath);
            console.log(metadata);
            let buff = Buffer.from(metadata, 'base64');
            let text = buff.toString('ascii');
            console.log("readFile - buff.toString");
            console.log(text);
        } else {
            console.log(metadataPath + "doesn't exist")
        }
        
        
        
        filesSoFar.forEach(f => {
                if (f.startsWith("result_")) {
                    console.log("found " + dir + "/" + f);
                    files.push({filename: f.substring(7),
                                path: dir + "/" + f, 
                                content: ""}); 
                    }
                });      
    
        //files.forEach(f => f.content = invokeLambda(readFileLambdaName, {fileName: f.name, dir: event.dir}, 'RequestResponse'));
    
    
    
            files.forEach(f => { 
                                var filePath = dir + "/" + f;
                                if (fs.existsSync(filePath)) {
                                    console.log("reading " + filePath);
                                    const result = fs.readFileSync(filePath);
                                    console.log(result);
                                    let buff = Buffer.from(result, 'base64');
                                    let text = buff.toString('ascii');
                                    console.log("readFile - buff.toString");
                                    console.log(text);
                                    f.content = text;
                                } else {
                                    console.log(filePath + "doesn't exist")
                                }
                            });

    console.log("event.username: " + event.username);
    console.log("event.repoName: " + event.repoName);
    console.log("event.pullRequestId: " + event.pullRequestId);
    const user = await getUserFromDB(event.username);
    console.log("user: " + user.toString());

    //var test = getViolations(files[0].content.violations, user.userId, event.repoName, event.pullRequestId, "TBA");

    console.log("files[0] " + files[0]);
    console.log("files[0] " + files[0].content);

    //violationPayload.push(test);
    var violationPayload = [];


    // files.forEach(f => violationPayload.push(getViolations(f.content.violations, event.userId, event.repoName, event.pullRequestId, "TBA")));

    // console.log("violation payload: " + violationPayload);

    // await sendViolationsToDB(violationPayload[0]);

    // var errCount = 0;

    // if (violationPayload.length > 0) {
    //     var statVal = "fail";
    //     errCount = violationPayload.length;
    // } 

    let emailPayload = {
        name: event.username,           // name of recipient
        statVal: "pass",        // pass/fail/error
        errCount: "123",       // number of violations
        repoName: event.repoName        // name of pr repo
    }

    invokeLambda(emailLambdaName, emailPayload, 'Event');


    fs.rmdirSync(dir, true);

    if (fs.existsSync(dir)) {
        console.log("file removal failed");
    }

};

function createViolation (violation, user, repo, pullRequestId, prTime) {

    console.log("create Violation");
    console.log("violation");
    console.log(violation);

    return { userId: user, 
            repoId: repo,
            prId: pullRequestId, 
            filePath: "path",
            lineNumber: violation.lineNumber,
            violationType: "",
            violationTime: prTime,
            dateFound: violation.dateFound }
}

function getViolations(results, user, repo, pullRequestId, prTime) {

    console.log("getViolations");
    console.log("results: ");
    console.log(results);

    var violations = [];

    results.forEach(v => violations.push(createViolation(v, user, repo, pullRequestId, prTime)));

    return violations;

}

// insert into Violations (userId, username, repoId, prId, filePath, lineNumber, violationType, violationTime, dateFound) 
// values ('111561841222565942402', 'HSBC Violation Viewer', 'R123', '31234', './testfilepath', '123', 'Violation Type 1', 
// '2020-08-24 13:45:23', '2020-08-24');

function sendViolationsToDB(violation) {

    console.log("sending a violation to db");
    // console.log(violation);

    const v = {"userId":"105966689851359954303","repoId":"Group4Test","prId":"788555280","filePath":"path","lineNumber":1,"ruleId":1,"prTime":"TBA","dateFound":1637827484447};

    const url = `https://juaqm4a9j6.execute-api.us-east-1.amazonaws.com/dev/violations`;
    return axios.post(url, v)
        .then((res) => {
            console.log(res.data);
            return res.data;
    }).catch((err) => {
        console.log(err);
    });
}

async function getUserFromDB(username) {

    console.log(`requesting email from database for ${username}`);
  
    const db_url = `https://juaqm4a9j6.execute-api.us-east-1.amazonaws.com/dev/users/?username=${username}`;
    return axios.get(db_url).then((res) => {
  
        console.log(res.data[0]);
        return res.data[0];
    }).catch((err) => {
      console.log(err);
  });
}