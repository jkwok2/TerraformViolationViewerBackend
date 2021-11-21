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

    while (filesSoFar.length < numFiles) {

        //check efs
        if (fs.existsSync(dir)) {
            filesSoFar = fs.readdirSync(dir);
            console.log("asdf");
            console.log(filesSoFar);
        } else {
            console.log(dir + "doesn't exist");
        }
    }

    console.log("have all files");
    console.log(filesSoFar);


    // let emailPayload = {
    //     name: "",           // name of recipient
    //     statVal: "",        // pass/fail/error
    //     errCount: "",       // number of violations
    //     address: "",        // email address of recipient
    //     repoName: ""        // name of pr repo
    // }

    // invokeLambda(emailLambdaName, emailPayload)
    
    return callback(null, response);
};