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
let violationsFound;
let errorsEncountered;
const file = {
  content: '',
  path: '',
};

const setFile = async(content, path) => {
    file.content = content;
    file.path = path;
    Object.freeze(file);
}

function mapRulesToYAMLContent(data) {
  return data.map((x) => {
    let yamlContent = YAML.parse(x.content);
    x.content = yamlContent;
    return x;
  });
}

const getLineNumber = (resourceType, resourceName) => {
    const searchString = `resource "${resourceType}" "${resourceName}"`;
    if (!file.content.includes(searchString)) {
        return -1;
    }
    const fileChunks = file.content.split(searchString);
    return fileChunks[0].split("\n").length;
}

const hasProperty = async(resource, propertyKey) => {
    for (const p of propertyKey.split(".")) {
        if (resource.hasOwnProperty(p)) {
            resource = resource[p];
        } else {
            return false;
        }
    }
    return true;
}

const getPropertyValue = async (resource, propertyKey) => {
    for (const p of propertyKey.split(".")) {
        resource = resource[p];
    }
    return resource;
}

const addError = async (e) => {
  errorsEncountered.push(e);
  console.log(`Error encountered at ${file.path}: ${JSON.stringify(e)}`);
  throw e;
}


const addViolation = async (violationRule, resourceType, resourceName, filePath, rulesObject) => {
  console.log(`Inside addViolation with violationRule: ${JSON.stringify(violationRule)}, resourceType: ${resourceType}, resourceName: ${resourceName}`);
  console.log(JSON.stringify(rulesObject));
  try {
    const lineNumber = getLineNumber(resourceType, resourceName);
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
const hasNotSingle = async (resourceType, resourceName, hasNotViolationRule, resource, filePath, rulesObject) => {
  // check if violation rule is properly formatted, if not ignore rule
  if (!hasProperty(hasNotViolationRule, "key")) return;
  try {
    // no violation if property does not exist, otherwise, keep checking
    if (!hasProperty(resource, hasNotViolationRule.key)) return;
    // checking for value
    if (hasNotViolationRule.hasOwnProperty("value")) {
      if (getPropertyValue(resource, hasNotViolationRule.key) === hasNotViolationRule.value) {
        addViolation(hasNotViolationRule, resourceType, resourceName, filePath, rulesObject);
      }
      return;
    }
    // checking for range
    if (hasNotViolationRule.hasOwnProperty("range")) {
      const rangeValues = hasNotViolationRule.range;
      const value = getPropertyValue(resource, hasNotViolationRule.key);
      if (rangeValues.some(v => v === value)) {
        addViolation(hasNotViolationRule, resourceType, resourceName, filePath, rulesObject);
      }
      return;
    }
    // has property when it shouldn't
    addViolation(hasNotViolationRule, resourceType, resourceName, filePath, rulesObject);
  } catch (e) {
    console.log(`Resource type: ${resourceType}, resource name: ${resourceName}, violation rule: ${hasNotViolationRule.id} skipped due to parsing error`);
  }
}

// has key, has key value, has key value in range
const hasSingle = async (resourceType, resourceName, hasViolationRule, resource, filePath, rulesObject) => {
  // check if violation rule is properly formatted, if not ignore rule
  console.log(`In hasSingle with resourceType: ${resourceType}, resourceName: ${resourceName}, hasViolationRule: ${JSON.stringify(hasViolationRule)}, resource: ${resource}`);
  if (!hasProperty(hasViolationRule, "key")) return;
  console.log(`rule has key for ${resourceName}`);
  try {
    // check if key is in resource
    if (!hasProperty(resource, hasViolationRule.key)) {
      addViolation(hasViolationRule, resourceType, resourceName, filePath, rulesObject);
      console.log(`Property is missing for ${resourceName}`);
      return;
    }
    // if checking for value, see if they match
    if (hasProperty(hasViolationRule, "value")) {
      if (getPropertyValue(resource, hasViolationRule.key) !== hasViolationRule.value) {
        addViolation(hasViolationRule, resourceType, resourceName, filePath, rulesObject);
        console.log(`Value does not equate for ${resourceName}`);
      }
      return;
    }
    // if checking for range, see if they match
    if (hasViolationRule.hasOwnProperty("range")) {
      const rangeValues = hasViolationRule.range;
      const value = getPropertyValue(resource, hasViolationRule.key);
      if (!rangeValues.some(v => v === value)) {
        addViolation(hasViolationRule, resourceType, resourceName, filePath, rulesObject);
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


const hasNotList = async (resourceType, resourceName, hasNotViolationRules, resource, filePath, rulesObject) => {
  hasNotViolationRules.forEach(r => {
    hasNotSingle(resourceType, resourceName, r, resource, filePath, rulesObject);
  })
}

const hasList = async (resourceType, resourceName, hasViolationRules, resource, filePath, rulesObject) => {
  hasViolationRules.forEach(r => {
    hasSingle(resourceType, resourceName, r, resource, filePath, rulesObject);
  });
}

const processResource = async (resource, violationRules, resourceType, resourceName, filePath) => {

  let rulesObject = violationRules.content
  if (typeof rulesObject !== "undefined") {
    if (rulesObject.hasOwnProperty('has')) {
      hasList(resourceType, resourceName, rulesObject.has, resource, filePath, violationRules);


    } else if (rulesObject.hasOwnProperty('has_not')) {
      hasNotList(resourceType, resourceName, rulesObject.has_not, resource, filePath, violationRules);
    }
  } else {
    console.log("undefined in process resource");
    return Promise.resolve(true);
  }
}

module.exports.parseFile = async (event, context, callback) => {
  violationsFound = [];
  errorsEncountered = [];

  const filename = event.filename;
  const filePath = event.path;
  const userId = event.userId;
  const prID = event.prId;
  const repo = event.repoName;
  const prDate = event.prDate;

  console.log(`start reading file ${filename}`);
  console.log(`start reading file ${filePath}`);

  const terraformFile = Buffer.from(event.content, 'base64').toString('ascii');
  setFile(terraformFile, event.path);

  const responseComplete = {
    statusCode: 200,
    body: `Parsing for ${file.path} is complete`,
  };

  try {
    const parsedTerraformFile = hcltojson(terraformFile);
    console.log(
      `Terraform file ${filename} parsed successfully as ${JSON.stringify(parsedTerraformFile)}`
    );

    console.log(
      `Are there resources? ${parsedTerraformFile.hasOwnProperty('resource')}`
    );
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
    console.log(`Query string: ${queryString}`);

    var pThreads = [];
    try {
      let lstOfRulez = await connection.query(queryString);
      console.log("after getRules");
      lstOfRulez = mapRulesToYAMLContent(lstOfRulez);
      console.log(JSON.stringify(lstOfRulez));

      for (let violationRulesByResourceType of lstOfRulez) {
        let rulezData = JSON.stringify(violationRulesByResourceType);

        if (rulezData !== '{}' && Object.keys(violationRulesByResourceType).length > 0 && resourceTypes.includes(violationRulesByResourceType.awsresource)) {
          console.log(`inside loop ${rulezData}`);
          const resourceType = violationRulesByResourceType.awsresource;
          const resources = parsedResources[resourceType];
          const resourceNames = Object.keys(resources);

          for (const rn of resourceNames) {
            console.log('rn: ' + rn);
            pThreads.push(
              await processResource(
                resources[rn],
                JSON.parse(rulezData),
                resourceType,
                rn,
                filePath
              )
            );
            console.log(`set thread to process of ${rn}`);
          }
        }
      }
      console.log('process Threads: ' + pThreads);
    } catch (e) {
      setImmediate(() => {
        throw e;
      });
    }

    Promise.all(pThreads)
      .then(async () => {

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
      })
      .catch((err) => {
        throw err;
      });
  } catch (err) {
    console.error(`${file.path}: ${err}`);
    addError('invalidTerraformFileError');
  } finally {
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
module.exports.setFile = setFile;