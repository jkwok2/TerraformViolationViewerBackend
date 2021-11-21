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
        // remove for testing purposes
        removeFile(filePath);
        console.log(filePath + "existted already, now removed"); 
    }

    console.log("write to " + filePath);
    fs.writeFileSync(filePath, event.fileContent);
    console.log("done writing " + filePath); 



    // PR<ID>/filename

    // const dir = event.dir;
    // const filePath = dir + "/" + event.fileName;

    // console.log("filePath: " + filePath);
    // console.log("dir: " + dir);

    // if (!fs.existsSync(dir)) {
    //     fs.mkdirSync(dir, true);
    //     console.log("created directory " + dir)
    // }
    // // if (fs.existsSync(filePath))
    // // {
    // //     // remove for testing purposes
    // //     removeFile(filePath);
    // //     console.log(filePath + " existed already, now removed"); 
    // // }

    // console.log("write to " + filePath);
    // fs.writeFileSync(filePath, event.fileContent);
    // console.log("done writing " + filePath); 

    // TODO!!! removes files for testing purposes, belongs somwhere else
    // removeFile(path);
    // console.log(path + "removed"); 

    // invokeLambda(readFileLambdaName, path);
    
    return callback(null, response);
};