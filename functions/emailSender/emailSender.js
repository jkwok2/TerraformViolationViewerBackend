const aws = require("aws-sdk");

const ses = new aws.SES({ region: "us-east-1" });

module.exports.emailSender = async function (event) {

  console.log("start of emailSender");
  console.log(event);

  let name;
  let statVal;
  let numViolations;
  let address;
  let repoName;

  if (event.email === null || event.email === 'undefined') {
    console.log("No email found")
    return;
  } else {
    address = event.email;
  }

  (event.name) ? name = event.name : ""; // if no name, leave blank
  (event.statVal) ? statVal = event.statVal : "error";
  (event.numViolations) ? numViolations = event.numViolations : 0;
  (event.repoName) ? repoName = event.repoName : 'Error: Repo Name Not Found';

  console.log("email sender lambda");
  console.log("name: " + name);
  console.log("statVal: " + statVal);
  console.log("numViolations: " + numViolations);
  console.log("repoName: " + repoName);
  console.log("email: " + address);

  let temp;
  let tempData;

  switch (statVal){
    case "pass":
      temp = "scannedTemplate";
      tempData = "{ \"name\":\"".concat(name).concat("\", \"repoName\":\"").concat(repoName).concat("\", \"numViolations\":\"").concat("no").concat("\" }");
      break;
    case "fail":
      temp = "scannedTemplate";
      tempData = "{ \"name\":\"".concat(name).concat("\", \"repoName\":\"").concat(repoName).concat("\", \"numViolations\":\"").concat(numViolations).concat("\" }");
      break;
    case "error":
      temp = "errorTemplate";
      tempData = "{ \"name\":\"".concat(name).concat("\", \"repoName\":\"").concat(repoName).concat("\" }");
      break;
  };

  console.log("got email template");

  let params = {
    Source: process.env.SOURCE_ADDRESS,
    Template: temp,
    Destination: {
      ToAddresses: [address]
    },
    TemplateData: tempData
  };
  console.log(params);
  console.log(`Sending email to ${address}`);
  return await ses.sendTemplatedEmail(params).promise()
};

// const event = {
//   name: "localtest", // name of recipient
//   email: "megthibodeau@gmail.com",
//   statVal: "success", // pass/fail/error
//   numViolations: 123, // number of violations
//   repoName: "local", // name of pr repo
// };
//
// emailSender(event);