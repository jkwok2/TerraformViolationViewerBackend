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

    // PR<ID>/filename

    const dir = '/mnt/files/' + event.pullRequestId;
    const path = dir + "/" + event.filename;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, true);
    }
    if (fs.existsSync(path))
    {
        // remove for testing purposes
        removeFile(path);
        console.log(path + "existted already, now removed"); 
    }

    console.log("write to " + path);
    fs.writeFileSync(path, event.fileContent);
    console.log("done writing " + path); 

    // TODO!!! removes files for testing purposes, belongs somwhere else
    removeFile(path);
    console.log(path + "removed"); 

    // invokeLambda(readFileLambdaName, path);
    
    return callback(null, response);
};