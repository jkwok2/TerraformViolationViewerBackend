'use strict';

const aws = require('aws-sdk');
const fs = require('fs');

const invokeLambda = require('functions/utilities/invokeLambda.js');
const removeFile =  require('functions/utilities/removeFile.js')

const readFileLambdaName = 'hsbc-backend-app-meg-dev-readFile';

module.exports.writeFile = async (event, context, callback) => {
    
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            input: event,
        }),
    };

    const dir = event.dir;
    const filePath = dir + "/" + event.fileName;


    // const dir = '/mnt/files/' + event.pullRequestId;
    // const path = dir + "/" + event.filename;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, true);
    }

    if (fs.existsSync(filePath))
    {
        // removes
        removeFile(filePath);
        console.log(filePath + "existed already, now removed"); 
    } 

    if (!fs.existsSync(filePath)) {
        console.log("writeFile lambda to " + filePath);
        fs.writeFileSync(filePath, event.content);
        console.log("writeFile done writing " + filePath); 
    }
    
    return callback(null, response);
};