// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const aws = require("aws-sdk");
const axios = require("axios");
//const usersAPI = require('functions/routes/users.js');

const ses = new aws.SES({ region: "us-east-1" });

module.exports.emailSender = async function (event) {
  /*

  //these four values need to be passed in by call to lambda
  let name
  let statVal
  let errCount
  let address

  if (event.name) { // to test this function alone
    name = event.name;
    statVal = event.statVal;
    errCount = event.errCount;
    address = event.address;
  } else {
    name = 'Kevin';
    statVal = 'pass';
    errCount = '0';
    address = 'kevinguorm@gmail.com';
  }

  let errURL = "www.testurl.com"; //this is yet to be decided

  const passTemp = {
    Body: {
      Text: {
        // might need to be in html
        Data:
            "Hello " + name + "," +
            "\n\n" +
            "Your latest pull request was scanned. " + "There were no errors found." +
            "\n\n" +
            "Click here to view your error history: " + errURL
      },
    },

    Subject: {
      Data:
          "noreply"
    },
  };

  const failTemp = {
    Body: {
      Text: {
        Data:
            "Hello " + name + "," +
            "\n\n" +
            "Your latest pull request was scanned. " + "There were " + errCount + " errors found." +
            "\n\n" +
            "Click here to view your error history: " + errURL
      },
    },

    Subject: {
      Data:
          "noreply"
    },
  };

  const errTemp = {
    Body: {
      Text: {
        Data:
            "Hello " + name + "," +
            "\n\n" +
            "Your latest pull request failed to scan. " +
            "\n\n" +
            "Click here to view your error history: " + errURL
      },
    },

    Subject: {
      Data:
          "noreply"
    },
  };
*/

  console.log("start of emailSEnder");
  let name
  let statVal
  let errCount
  let address
  let repoName

  if (event.name && event.statVal && event.errCount && event.repoName) {
    name = event.name;
    statVal = event.statVal;
    errCount = event.errCount;
    repoName = event.repoName
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
  console.log("about to get email");
  address = await getEmailFromDB(name);
  console.log("name: " + name);
  console.log("address: " + address);

  let params = {
    Source: "Group 4 <cpsc319fall2021@gmail.com>",
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

  console.log(`requesting github email for ${username}`);

  const db_url = `https://juaqm4a9j6.execute-api.us-east-1.amazonaws.com/dev/users/${username}`;
  return axios.get(db_url).then((res) => {
      console.log(res);
      return res;
  });
}

// async function getEmailFromDB(username) {

//   return usersAPI.get({username: username}, {
//     statusCode: 200
//     });

// }