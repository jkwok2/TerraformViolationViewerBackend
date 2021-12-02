// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const aws = require("aws-sdk");
const axios = require("axios");
//const usersAPI = require('functions/routes/users.js');

const ses = new aws.SES({ region: "us-east-1" });

module.exports.emailSender = async function (event) {

  console.log("start of emailSender");
  let name
  let statVal
  let errCount
  let address
  let repoName

  console.log(event);

  if (event.name && event.statVal && event.repoName && event.address) {
    name = event.name;
    statVal = event.statVal;
    errCount = event.errCount;
    repoName = event.repoName;
    address = event.address;
    console.log("got stuff from monitor");
  } else {
    name = "Kevin"
    statVal = 'pass';
    errCount = '420';
    address = 'megthibodeau@gmail.com';
    repoName = "myRepo";
    console.log("missing stuff from monitor");
  }

  console.log("email sender lambda");
  console.log("name: " + name);
  console.log("statVal: " + statVal);
  console.log("errCount: " + errCount);
  console.log("repoName: " + repoName);
  console.log("address: " + address);

  let temp;
  let tempData;

  //tempData = { "name":"Kevin", "repoName":"someRepo", "errCount":"420"}

  switch (statVal){
    case "pass":
      temp = "scannedTemplate";
      tempData = "{ \"name\":\"".concat(name).concat("\", \"repoName\":\"").concat(repoName).concat("\", \"errCount\":\"").concat("no").concat("\" }");
      break;
    case "fail":
      temp = "scannedTemplate";
      tempData = "{ \"name\":\"".concat(name).concat("\", \"repoName\":\"").concat(repoName).concat("\", \"errCount\":\"").concat(errCount).concat("\" }");
      break;
    case "error":
      temp = "errorTemplate";
      tempData = "{ \"name\":\"".concat(name).concat("\", \"repoName\":\"").concat(repoName).concat("\" }");
      break;
  };


  //address = await getGithubUserEmail(name);
  // console.log("about to get email");
  // address = await getEmailFromDB(name);
  // console.log("name: " + name);
  // console.log("address: " + address);

  let params = {
    Source: process.env.SOURCE_ADDRESS,
    Template: temp,
    Destination: {
      ToAddresses: [address]
    },
    TemplateData: tempData
  };
  console.log("sending email..");
  console.log("address: " + address);
  return ses.sendTemplatedEmail(params).promise()
};

async function getEmailFromDB(username) {

  console.log(`requesting email from database for ${username}`);

  const db_url = `https://juaqm4a9j6.execute-api.us-east-1.amazonaws.com/dev/users/?username=${username}`;
  return axios.get(db_url).then((res) => {
    console.log(res.data[0]);
    return res.data[0].email;
  });
}

// async function getEmailFromDB(username) {

//   return usersAPI.get({username: username}, {
//     statusCode: 200
//     });

// }