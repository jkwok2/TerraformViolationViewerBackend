'use strict';

const aws = require('aws-sdk');
const fs = require('fs');

const invokeLambda = require('functions/utilities/invokeLambda.js');
const removeFile =  require('functions/utilities/removeFile.js')

const readFileLambdaName = 'hsbc-backend-app-meg-dev-readFile';
const emailLambdaName = 'hsbc-backend-app-meg-dev-emailSender';

module.exports.monitor = async (event, context, callback) => {
    
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

            const directoryNotFoundResponse = {
                statusCode: 503,
                body: "directoryNotFound",
            };

            return callback(null, directoryNotFoundResponse);
        }

        c++;
        if (c > 10) {
            break;
        }
    }

    console.log("have all files");
    console.log(filesSoFar);


    let emailPayload = {
        name: event.username,           // name of recipient
        statVal: "pass",        // pass/fail/error
        errCount: "1",       // number of violations
        repoName: event.repoName        // name of pr repo
    }

    invokeLambda(emailLambdaName, emailPayload)
    
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            input: event,
        }),
    };

    return callback(null, response);
};