const aws = require('aws-sdk');


aws.config.region = process.region;
var lambda = new aws.Lambda();

/*
*   Invoke lambda asynchronously with no response expected
*   payload is JSON object specific to lambda
*   lambdaName is longform name from deployed lambda function. 
*       Example: hsbc-backend-app-meg-dev-webhook
*/
const invokeLambda = (lambdaName, payload) => {

    var params = {
        FunctionName: lambdaName, // Name of the function to be called
        InvocationType: 'Event', // For synchronous calls
        LogType: 'None', // Do not return log from invoked function 
        Payload : JSON.stringify(payload) // The payload sent to the function
    };

    return lambda.invoke(params, function(err, data) {
        if (err) {
            console.log(`Error when invoking ${params.FunctionName}`);
            throw err;
        } else {
            console.log(`${params.FunctionName} invoked`)
        }
      }).promise();
};

module.exports = invokeLambda;