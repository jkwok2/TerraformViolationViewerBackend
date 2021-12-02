'use strict';

const axios = require('axios');
const invokeLambda = require('functions/utilities/invokeLambda.js');
const emailLambdaName = 'hsbc-backend-app-dev-emailSender';

module.exports.monitor = async (event, callback) => {

  const prId = event.prId;
  const prDate = event.prDate;
  const numViolations = event.numViolations;

  // check database for results
  let tries = 0;
  let results = 0;
  const prUpdateTime = new Date(prDate).toISOString();
  console.log("prUpdateTime: " + prUpdateTime);

  while (tries < 10) {
    setInterval(function() {console.log("Waiting to check results in db again...")}, 1000);

    results = getResultsFromDB(prUpdateTime);
    // checking if we have all the results
    if (results.length == numViolations) {
      console.log(`${prId}-${prDate}: Found ${results.length} violations.`);
      break;
    }
    tries++;
  }

  console.log(`results: ${results}`)

}

async function getResultsFromDB(updateTime) {

  console.log(`requesting results from database for ${updateTime}`);

  const db_url = `https://u4uplkwumb.execute-api.ca-central-1.amazonaws.com/dev/results/?prUpdateTime=${updateTime}`;
  console.log(db_url);

  return axios.get(db_url)
      .then((res) => {
        return res.data;
      }).catch((err) => {
        console.log("ret results from DB err " + err);
        return err;
      });
}