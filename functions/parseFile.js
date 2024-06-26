var aws = require('aws-sdk');
const hcltojson = require('hcl-to-json');
const YAML = require('yaml');

const invokeLambda = require('../functions/utilities/invokeLambda.js');
const emailLambdaName = 'hsbc-backend-app-dev-emailSender';
const saveViolationsLambdaName = 'hsbc-backend-app-dev-saveViolations';

const connection = require('serverless-mysql')({
  config: {
    host: 'database-1.cphcofv6hw3s.us-east-1.rds.amazonaws.com',
    database: 'database-1',
    user: 'admin',
    password: 'cpsc319aws!',
  },
});

aws.config.region = process.region;

function mapRulesToYAMLContent(data) {
  return data.map((x) => {
    let yamlContent = YAML.parse(x.content);
    x.content = yamlContent;
    return x;
  });
}

const getLineNumber = (resourceType, resourceName, file) => {
  const regexString = `resource\\s+("${resourceType}"|'${resourceType}')\\s+("${resourceName}"|'${resourceName}')`;
  const regex = new RegExp(regexString, 'g');
  const searchString = file.content.match(regex);
  console.log(regexString);
  console.log(file.content);
  console.log(searchString);
  if (searchString === undefined || searchString === null || searchString.length < 1) return -1;
  const fileChunks = file.content.split(searchString[0]);
  return fileChunks[0].split("\n").length;
}

const hasProperty = (resource, propertyKey) => {
    if (resource === undefined || resource === null || JSON.stringify(resource) === '{}' || JSON.stringify(resource) === '') return false;
    for (const p of propertyKey.split(".")) {
        if (resource.hasOwnProperty(p)) {
            resource = resource[p];
        } else {
            return false;
        }
    }
    return true;
}

const getPropertyValue = (resource, propertyKey) => {
    for (const p of propertyKey.split(".")) {
        resource = resource[p];
    }
    return resource;
}

const addError = (e) => {
  errorsEncountered.push(e);
  throw e;
}


const addViolation = (violationRule, resourceType, resourceName, filePath, rulesObject, file, violationsFound) => {
  console.log(`Inside addViolation with violationRule: ${JSON.stringify(violationRule)}, resourceType: ${resourceType}, resourceName: ${resourceName}`);
  console.log(JSON.stringify(rulesObject));
  try {
    const lineNumber = getLineNumber(resourceType, resourceName, file, violationsFound);
    const violation = {
      violationRuleId: rulesObject.ruleId,
      filePath: filePath,
      lineNumber: lineNumber,
      dateFound: Date.now(),
      resourceType: resourceType,
      resourceName: resourceName
    }

    console.log(`${file.path}: Violation found: ${JSON.stringify(violation)}`);
    violationsFound.push(violation);

  } catch (e) {
    console.log(`${file.path}: Violation not added because of error: ${e}`);
  }
}

// has no key, has no value at key, has no value in range at key
const hasNotSingle = (resourceType, resourceName, hasNotViolationRule, resource, filePath, rulesObject, file, violationsFound) => {
  // check if violation rule is properly formatted, if not ignore rule
  if (!hasProperty(hasNotViolationRule, "key")) return;
  try {
    // no violation if property does not exist, otherwise, keep checking
    if (!hasProperty(resource, hasNotViolationRule.key)) return;
    // checking for value
    if (hasNotViolationRule.hasOwnProperty("value")) {
      if (getPropertyValue(resource, hasNotViolationRule.key) === hasNotViolationRule.value) {
        addViolation(hasNotViolationRule, resourceType, resourceName, filePath, rulesObject, file, violationsFound);
      }
      return;
    }
    // checking for range
    if (hasNotViolationRule.hasOwnProperty("range")) {
      const rangeValues = hasNotViolationRule.range;
      const value = getPropertyValue(resource, hasNotViolationRule.key);
      if (rangeValues.some(v => v === value)) {
        addViolation(hasNotViolationRule, resourceType, resourceName, filePath, rulesObject, file, violationsFound);
      }
      return;
    }
    // has property when it shouldn't
    addViolation(hasNotViolationRule, resourceType, resourceName, filePath, rulesObject, file, violationsFound);
  } catch (e) {
    console.log(`Resource type: ${resourceType}, resource name: ${resourceName}, violation rule: ${hasNotViolationRule.id} skipped due to parsing error`);
  }
}

// has key, has key value, has key value in range
const hasSingle = (resourceType, resourceName, hasViolationRule, resource, filePath, rulesObject, file, violationsFound) => {
  // check if violation rule is properly formatted, if not ignore rule
  console.log(`In hasSingle with resourceType: ${resourceType}, resourceName: ${resourceName}, hasViolationRule: ${JSON.stringify(hasViolationRule)}, resource: ${resource}`);
  console.log(resource);
  if (!hasProperty(hasViolationRule, "key")) return;
  console.log(`rule has key for ${resourceName}`);
  try {
    // check if key is in resource
    console.log(`hasProperty(${JSON.toString({resource})}, ${hasViolationRule.key}): ${hasProperty(resource, hasViolationRule.key)}`)
    if (!hasProperty(resource, hasViolationRule.key)) {
      //console.log(`has single !hasProperty: ${hasViolationRule.key}`);
      addViolation(hasViolationRule, resourceType, resourceName, filePath, rulesObject, file, violationsFound);
      console.log(`Property is missing for ${resourceName}`);
      return;
    }
    // if checking for value, see if they match
    if (hasProperty(hasViolationRule, "value")) {
      if (getPropertyValue(resource, hasViolationRule.key) !== hasViolationRule.value) {
        addViolation(hasViolationRule, resourceType, resourceName, filePath, rulesObject, file, violationsFound);
        console.log(`Value does not equate for ${resourceName}`);
      }
      return;
    }
    // if checking for range, see if they match
    if (hasViolationRule.hasOwnProperty("range")) {
      const rangeValues = hasViolationRule.range;
      const value = getPropertyValue(resource, hasViolationRule.key);
      if (!rangeValues.some(v => v === value)) {
        addViolation(hasViolationRule, resourceType, resourceName, filePath, rulesObject, file, violationsFound);
        console.log(`Range does not equate for ${resourceName}`);
      }
      return;
    }
    console.log(`No violation found for ${resourceName}`);
    // No violations found
  } catch (e) {
    console.log(`Resource type: ${resourceType}, resource name: ${resourceName}, violation rule: ${hasViolationRule.id} skipped due to parsing error`);
  }
}


const hasNotList = (resourceType, resourceName, hasNotViolationRules, resource, filePath, rulesObject, file, violationsFound) => {
  hasNotViolationRules.forEach(r => {
    hasNotSingle(resourceType, resourceName, r, resource, filePath, rulesObject, file, violationsFound);
  })
}

const hasList = (resourceType, resourceName, hasViolationRules, resource, filePath, rulesObject, file, violationsFound) => {
  hasViolationRules.forEach(r => {
    hasSingle(resourceType, resourceName, r, resource, filePath, rulesObject, file, violationsFound);
  });
}

const processResource = (resource, violationRules, resourceType, resourceName, filePath, file, violationsFound) => {

  let rulesObject = violationRules.content
  if (typeof rulesObject !== "undefined") {
    if (rulesObject.hasOwnProperty('has')) {
      hasList(resourceType, resourceName, rulesObject.has, resource, filePath, violationRules, file, violationsFound);


    } else if (rulesObject.hasOwnProperty('has_not')) {
      hasNotList(resourceType, resourceName, rulesObject.has_not, resource, filePath, violationRules, file, violationsFound);
    }
  } else {
    console.log("undefined in process resource");
    return Promise.resolve(true);
  }
}

module.exports.parseFile = async (event, context, callback) => {
  let violationsFound = [];
  let errorsEncountered = [];

  const filename = event.filename;
  const filePath = event.path;
  const userId = event.userId;
  const prID = event.prId;
  const repo = event.repoName;
  const prDate = event.prDate;

  const terraformFile = Buffer.from(event.content, 'base64').toString('ascii');

  const file = {content: terraformFile, path: event.path};
  Object.freeze(file);

  const responseComplete = {
    statusCode: 200,
    body: `Parsing for ${file.path} is complete`,
  };

  try {
    const parsedTerraformFile = hcltojson(terraformFile);
    console.log(
      `Terraform file ${filename} parsed successfully as ${JSON.stringify(parsedTerraformFile)}`
    );

    // console.log(
    //   `Are there resources? ${parsedTerraformFile.hasOwnProperty('resource')}`
    // );
    if (!parsedTerraformFile.hasOwnProperty('resource')) {
      return callback(null, responseComplete);
    }

    let parsedResources = parsedTerraformFile.resource;
    parsedResources = JSON.parse(JSON.stringify(parsedResources));
    const resourceTypes = Object.keys(parsedResources);
    console.log(`The AWS Resource Types in this file are ${JSON.stringify(resourceTypes)}`);

    if (resourceTypes.length === 0) callback(null, responseComplete);
    const resourceTypesStringify = resourceTypes.join('" OR awsresource = "');
    const queryString = 'SELECT * FROM `database-1`.`Rules` WHERE status = "active" AND (awsresource = "' + resourceTypesStringify + '")';
    // console.log(`Query string: ${queryString}`);

    // var pThreads = [];
    try {
      let lstOfRulez = await connection.query(queryString);
      // console.log("after getRules");
      lstOfRulez = mapRulesToYAMLContent(lstOfRulez);
      console.log(JSON.stringify(lstOfRulez));

      for (let violationRulesByResourceType of lstOfRulez) {
        let rulezData = JSON.stringify(violationRulesByResourceType);

        if (rulezData !== '{}' && Object.keys(violationRulesByResourceType).length > 0 && resourceTypes.includes(violationRulesByResourceType.awsresource)) {
          // console.log(`inside loop ${rulezData}`);
          const resourceType = violationRulesByResourceType.awsresource;
          const resources = parsedResources[resourceType];
          const resourceNames = Object.keys(resources);

          for (const rn of resourceNames) {
            // console.log('rn: ' + rn);
            // pThreads.push(
              processResource(
                resources[rn],
                JSON.parse(rulezData),
                resourceType,
                rn,
                filePath,
                file,
                violationsFound
              )
            // );
            // console.log(`set thread to process of ${rn}`);
          }
        }
      }
      // console.log('process Threads: ' + pThreads);
    } catch (e) {
      setImmediate(() => {
        throw e;
      });
    }

    // Promise.all(pThreads)
    //   .then(async () => {

        console.log(`${file.path}: Scanning complete`);

        const result = {
            errors: errorsEncountered,
            violations: violationsFound,
        };

        console.log(`${file.path}: Result: ${JSON.stringify(result)}`);

        let violations = [];
        let prCreated = new Date(prDate);
        prCreated = prCreated.toISOString();

        for (const violationData of result.violations) {

            let violationFound = new Date(violationData.dateFound);
            violationFound = violationFound.toISOString();

            const dbData = {
            userId: userId,
            repoId: repo,
            prId: prID.toString(),
            filePath: file.path,
            lineNumber: violationData.lineNumber,
            ruleId: violationData.violationRuleId,
            prTime: prCreated,
            dateFound: violationFound,
            };

            violations.push(dbData);
        }

        let statVal = 'success';
        if (violations.length > 0) {
            console.log(`${file.path}: ${violations.length} violations found`);
            invokeLambda(saveViolationsLambdaName, {
                violations: violations,
                filename: filename,
                path: filePath,
            });
            console.log(`${file.path}: violations sent to saveViolations lambda`);
            statVal = 'fail';
        } else {
            console.log(`${file.path}: no violations found.`);
        }

        let emailPayload = {
            name: event.username, // name of recipient
            email: event.email,
            statVal: statVal, // pass/fail/error
            numViolations: violations.length, // number of violations
            repoName: repo, // name of pr repo
        };

        invokeLambda(emailLambdaName, emailPayload);

        console.log(`${file.path}: Finished`);
        return;
      // })
      // .catch((err) => {
      //   throw err;
      // });
  } catch (err) {
    console.error(`${file.path}: ${err}`);
    console.log(`Error encountered at ${file.path}: ${JSON.stringify(err)}`);
    addError('invalidTerraformFileError');
  }
};


// // TODO: TA - uncomment the code below and run it locally for easier debugging :-)
// const event = {
//     filename: "local-test.tf",
//     content: 'cmVzb3VyY2UgImF3c19hdGhlbmFfd29ya2dyb3VwIiAidGVzdCIgewogY29u\n' +
//         'ZmlndXJhdGlvbiB7CiAgIHJlc3VsdF9jb25maWd1cmF0aW9uIHsKICAgICBv\n' +
//         'dXRwdXRfbG9jYXRpb24gPSAiczM6Ly9teXMzYnVja2V0IgogICAgfQogIH0K\n' +
//         'fQoKcmVzb3VyY2UgImF3c19zZWN1cml0eV9ncm91cCIgImV4YW1wbGUiIHsK\n' +
//         'ICBpbmdyZXNzIHsKICAgIGZyb21fcG9ydCAgID0gMzM4OQogICAgdG9fcG9y\n' +
//         'dCAgICAgPSAzMzg5CiAgICBwcm90b2NvbCAgICA9ICJ0Y3AiCiAgICBjaWRy\n' +
//         'X2Jsb2NrcyA9IFsiMC4wLjAuMC8wIl0KICB9ICAKfQoKcmVzb3VyY2UgImF3\n' +
//         'c19jbG91ZGZyb250X2Rpc3RyaWJ1dGlvbiIgImNsb3VkZnJvbnQiIHsKICBk\n' +
//         'ZWZhdWx0X2NhY2hlX2JlaGF2aW9yIHsKICAgIHRhcmdldF9vcmlnaW5faWQg\n' +
//         'ICAgICAgPSAibXktb3JpZ2luIgogICAgdmlld2VyX3Byb3RvY29sX3BvbGlj\n' +
//         'eSA9ICJhbGxvdy1hbGwiCiAgfQp9Cg==\n',
//     path: "/Group4HSBC/",
//     username:  "mthibodeau",
//     userId:  "105966689851359954303",
//     email: "megthibodeau@gmail.com",
//     repoName: "local",
//     prDate: new Date(),
//     prId: 1234
//
//
// }
//
// parseFile(event, undefined, undefined);

module.exports.getLineNumber = getLineNumber;
module.exports.hasProperty = hasProperty;
module.exports.getPropertyValue = getPropertyValue;