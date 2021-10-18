// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const aws = require("aws-sdk");
const ses = new aws.SES({ region: "us-east-1" });

module.exports.handler = async function (event) {

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

  let template = errTemp;

  switch (statVal){
    case "pass":
      template = passTemp;
      break;
    case "fail":
      template = failTemp;
      break;
    case "error":
      template = errTemp;
  };

  let params = {
    Destination: {
      ToAddresses: [address]
    },
    Message: template,
    Source: "kevinguowm@gmail.com",
  };

  return ses.sendEmail(params).promise()
};