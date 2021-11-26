var aws = require('aws-sdk');
const fs = require('fs')
const hcltojson = require('hcl-to-json');
const { InvalidTerraformFileError, LineNumberNotFoundError, GrepError } = require("./additionalViolationErrors");
const initializeConnection = require('./routes/common');
const YAML = require('yaml')
const axios = require('axios')

// const invokeLambda = require('functions/utilities/invokeLambda.js');
// const writeFileLambdaName = 'hsbc-backend-app-meg-dev-writeFile';
const emailLambdaName = 'hsbc-backend-app-meg-dev-emailSender';

aws.config.region = process.region;
//const spawn = require('child_process').spawn;
const { exec } = require('child_process');
let violationsFound;
let errorsEncountered;
const file = {
    content: "",
    efsFullPath: "",
    githubFullPath: "",
};

function mapRules(data) {
    return data.map(x => {
        let yamlContent = YAML.parse(x.content);
        x.content = yamlContent
        return x;
    });
}

function setValue(result) {
    return mapRules(result);
    // console.log('rules: ' + rulez);
}

function createObject(rulez) {
    // console.log(rulez[0].content)
    // console.log(rulez[1].content)
    let setOfResources = new Set();
    for (let rule of rulez) {
        // console.log(rule);
        // console.log('a: '+ rule.content.resource)
        setOfResources.add(rule.content.resource);
    }

    let mapOfRules = new Map();
    for (let resource of setOfResources) {
        let combinedRuleObj = {};
        combinedRuleObj.aws_resource_type = resource;
        combinedRuleObj.has = [];
        combinedRuleObj.not_has = [];
        mapOfRules.set(resource, combinedRuleObj);
    }
    // console.log(mapOfRules)
    for (let rules of rulez) {
        console.log(rules);
        let data = rules.content;
        // console.log(data)
        if (data.has) {
            // console.log('has')
            let obj = mapOfRules.get(data.resource);
            let hasArray = obj.has;
            data.has.forEach(hasObj => {
                hasObj.id = rules.ruleId;
                hasObj.category = rules.violationCategory;
                hasObj.severity = rules.severity;
                hasArray.push(hasObj);
            });
            obj.has = hasArray;
            mapOfRules.set(data.resource, obj);
        }
        if (data.has_not) {
            // console.log('has_not')
            let obj = mapOfRules.get(data.resource);
            let hasNotArray = obj.not_has;
            data.has_not.forEach(hasNotObj => {
                hasNotObj.id = rules.ruleId;
                hasNotObj.category = rules.violationCategory;
                hasNotObj.severity = rules.severity;
                hasNotArray.push(hasNotObj);
            });
            obj.not_has = hasNotArray;
            mapOfRules.set(data.resource, obj);
        }
    }

    let rules = Array.from(mapOfRules.values());
    for (rule of rules) {
        if (rule.has.length === 0) {
            delete rule.has;
        }
        if (rule.not_has.length === 0) {
            delete rule.not_has;
        }
    }
    // console.log(rules)
    return rules;
} 

// const invokeLambda = require('functions/utilities/invokeLambda.js');
// const writeFileLambdaName = 'hsbc-backend-app-meg-dev-writeFile';



const grepWithShell = async(grepSearch) => {
    // const child = spawn('grep', ['-n -E', grepSearch, file.content]);
    const child = exec(`grep -n -E ${grepSearch} ${file.content}`);
    let res = '';
    child.stdout.on('data', (buffer) => { res += buffer.toString(); });
    child.stdout.on('end', () => {});
    return res;
};

// function grepWithShell(valueToLookFor) {
//     const f = `sdf dfd resource is in this line`;
//     return new Promise((resolve, reject) => {
//         const spawn = require('child_process').spawn;
//         let res = '';
//         console.log(`In grepWithShell, file: ${f}`);
//         const child = spawn('grep', ['-n', valueToLookFor, f]);
//         child.stdout.on('data', function (buffer) { res += buffer.toString(); });
//         child.stdout.on('end', function () { 
//             if (res === ''){
//                 res = 'err: could not find property or value in file'
//             }
//             console.log(`res: ${res}`);
//             resolve(res) 
//         });
//     });
// };

const getLineNumber = async(resourceType, resourceName) => {
    return 1;
    console.log(`Inside getLineNumber with resourceType: ${resourceType}, resourceName: ${resourceName}`);
    // const grepSearch = `resource "${resourceType}" "${resourceName}"`;
    const grepSearch = `resource`;
    console.log(`grepSearch: ${grepSearch}`);
    try{
        const lines = await grepWithShell(grepSearch);
        if (lines === "") {
            //violationsFound.push(new Violation(DEFAULT_VIOLATION_ID, LINE_NUMBER_NOT_FOUND, DEFAULT_VIOLATION_LINE_NUMBER, resourceType, resourceName));
            console.log(`lines === "", error thrown`);
            const parseError = new LineNumberNotFoundError(file.githubFullPath, grepSearch);
            addError(parseError);
        }
        const lineNumber = lines.split(":")[0];
        console.log(`lineNumber: ${lineNumber}`);
        if (Number.isInteger(lineNumber)) return lineNumber;
        console.log(`lineNumber is not a number, error thrown`);
        const grepError = new GrepError(file.githubFullPath, grepSearch, `Unexpected value returned from line search: ${lines}`);
        addError(grepError);
    } catch (e) {
        console.log(`error caught in getLineNumber`);
        if (e instanceof LineNumberNotFoundError || e instanceof GrepError) throw e;
        else {
            //violationsFound.push(new Violation(DEFAULT_VIOLATION_ID, GREP_ERROR, DEFAULT_VIOLATION_LINE_NUMBER, resourceType, resourceName));
            const grepError =  new GrepError(file.githubFullPath, grepSearch, e);
            addError(grepError);
            throw grepError;
        }
    }
}

const hasProperty = async(resource, propertyKey) => {
    propertyKey.split(".").forEach(p => {
        if (resource.hasOwnProperty(p)) {
            resource = resource[p];
        } else {
            return false;
        }
    });
    return true;
}

const getPropertyValue = async (resource, propertyKey) => {
    propertyKey.split(".").forEach(p => {
        resource = resource[p];
    });
    return resource;
}

const addError = async(e) => {
    errorsEncountered.push(e);
    console.log("error " + e);
    console.log(`Error encountered at ${file.efsFullPath}: ${JSON.stringify(e)}`);
    throw e;
}

const addViolation = async(violationRule, resourceType, resourceName) => {
    console.log(`Inside addViolation with violationRule: ${violationRule}, resourceType: ${resourceType}, resourceName: ${resourceName}`);
    try {
        const lineNumber = await getLineNumber(resourceType, resourceName);
        // userId, filePath, lineNumber, violationType, dateFound
        const violation = { violationRuleId: violationRule.id, 
                            //severity: violationRule.severity,
                            //category: violationRule.category,
                            lineNumber: lineNumber,
                            dateFound: Date.now(),
                            //resourceType: resourceType,
                            //resourceName: resourceName
                            }

        console.log("violation found: " + JSON.stringify(violation));
        violationsFound.push(violation);                   

    } catch (e) {
        console.log(`Violation is not added because of error: ${e}`);
    }
}

// has no key, has no value at key, has no value in range at key
const hasNotSingle = async(resourceType, resourceName, hasNotViolationRule, resource) => {
    // check if violation rule is properly formatted, if not ignore rule
    if (!hasProperty(hasNotViolationRule, "key")) return;
    try {
        // no violation if property does not exist, otherwise, keep checking
        if (!hasProperty(resource, hasNotViolationRule.key)) return;
        // checking for value
        if (hasNotViolationRule.hasOwnProperty("value")) {
            if (getPropertyValue(resource, hasNotViolationRule.key) === hasNotViolationRule.value) {
                addViolation(hasNotViolationRule, resourceType, resourceName);
            }
            return;
        }
        // checking for range
        if (hasNotViolationRule.hasOwnProperty("range")) {
            const rangeValues = hasNotViolationRule.range;
            const value = getPropertyValue(resource, hasNotViolationRule.key);
            if (rangeValues.some(v => v === value)) {
                addViolation(hasNotViolationRule, resourceType, resourceName);
            }
            return;
        }
        // has property when it shouldn't
        addViolation(hasNotViolationRule, resourceType, resourceName);
    } catch (e) {
        console.log(`Resource type: ${resourceType}, resource name: ${resourceName}, violation rule: ${hasNotViolationRule.id} skipped due to parsing error`);
    }
}

// has key, has key value, has key value in range
const hasSingle = async(resourceType, resourceName, hasViolationRule, resource) => {
    // check if violation rule is properly formatted, if not ignore rule
    console.log(`In hasSingle with resourceType: ${resourceType}, resourceName: ${resourceName}, hasViolationRule: ${hasViolationRule}, resource: ${resource}`);
    if (!hasProperty(hasViolationRule, "key")) return;
    console.log(`rule has key for ${resourceName}`);
    try {
        // check if key is in resource
        if (!hasProperty(resource, hasViolationRule.key)) {
            addViolation(hasViolationRule, resourceType, resourceName);
            console.log(`Property is missing for ${resourceName}`);
            return;
        }
        // if checking for value, see if they match
        if (hasProperty(hasViolationRule, "value")) {
            if (getPropertyValue(resource, hasViolationRule.key) !== hasViolationRule.value) {
                addViolation(hasViolationRule, resourceType, resourceName);
                console.log(`Value does not equate for ${resourceName}`);
            }
            return;
        }
        // if checking for range, see if they match
        if (hasViolationRule.hasOwnProperty("range")) {
            const rangeValues = hasViolationRule.range;
            const value = getPropertyValue(resource, hasViolationRule.key);
            if (!rangeValues.some(v => v === value)) {
                addViolation(hasViolationRule, resourceType, resourceName);
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


const hasNotList = async(resourceType, resourceName, hasNotViolationRules, resource) => {
    hasNotViolationRules.forEach(r => {
        hasNotSingle(resourceType, resourceName, r, resource);
    })
}

const hasList = async(resourceType, resourceName, hasViolationRules, resource) => {
    hasViolationRules.forEach(r => {
        hasSingle(resourceType, resourceName, r, resource);
    });
}

const processResource = async(resource, violationRules, resourceType, resourceName) => {
    if (violationRules.hasOwnProperty('has')) {
        hasList(resourceType, resourceName, violationRules.has, resource);
    }
    if (violationRules.hasOwnProperty('has_not')) {
        hasNotList(resourceType, resourceName, violationRules.has_not, resource);
    }
}

module.exports.parseFile = async (event, context, callback) => {
    violationsFound = [];
    errorsEncountered = [];

    const fileName = event.fileName;
    const dir = event.dir;
    const githubFullPath = event.githubFullPath;
    const filePath = dir + "/" + fileName;

    const username = event.username;
    const repo = event.repoName;
    const prDate = event.prDate;

    // getFile(filePath, fileName, githubFullPath);
    console.log(`start reading file ${fileName}`);
    console.log(`start reading file ${filePath}`);

    // hacky way to get around race condition if file doesn't exist in EFS yet
    var fileNotFound = true;
    var terraformFile;
    while (fileNotFound) {
        if (fs.existsSync(filePath)) {
            const tempFile = fs.readFileSync(filePath, {encoding: 'utf8'});
            //console.log(tempFile);
            terraformFile = Buffer.from(tempFile, 'base64').toString('ascii');
            fileNotFound = false;
            console.log("done reading file " + filePath);
            //console.log(`Terraform file read: ${terraformFile}`);
        }
    }

    file.content = terraformFile;
    file.efsFullPath = filePath;
    file.githubFullPath = githubFullPath;
    Object.freeze(file);

    const responseComplete = {
        statusCode: 200,
        body: `Parsing for ${file.githubFullPath} is complete`
    }

    //const processThreads = [];

    try {
        const parsedTerraformFile = hcltojson(terraformFile);
        console.log(`Terraform file ${fileName} parsed successfully as ${JSON.stringify(parsedTerraformFile)}`);
        
        console.log(`Are there resources? ${parsedTerraformFile.hasOwnProperty("resource")}`);
        if (!parsedTerraformFile.hasOwnProperty("resource")) {
            return callback(null, responseComplete);
        }

        const parsedResources = parsedTerraformFile.resource;
        const resourceTypes = Object.keys(parsedResources);
        console.log(`The AWS Resource Types in this file are ${JSON.stringify(resourceTypes)}`);

        if (resourceTypes.length === 0) callback(null, responseComplete);
        const resourceTypesStringify = resourceTypes.join('" OR awsresource = "');
        const queryString = 'SELECT * FROM `database-1`.`Rules` WHERE status = "active" AND (awsresource = "' + resourceTypesStringify + '")';
        console.log(`Query string: ${queryString}`);

        const con = initializeConnection();
        // let rulez = [];
        // con.query(
        //     //'SELECT * FROM `database-1`.`Rules` WHERE status = "active" AND (awsresource = "aws_athena_workgroup" OR awsresource = "aws_elb")',
        //     queryString,
        //     function (err, result) {
        //         if (err) {
        //             throw err;
        //         }
        //         if (result) {
        //             console.log(result);
        //             rulez = setValue(result);
        //             result = createObject(rulez)
        //             console.log(JSON.stringify(result));
        //             con.end();

        var pThreads = await getRules(con, queryString).then((result) => {
                    console.log("after getRules");

                    console.log(result);
                    rulez = setValue(result);
                    result = createObject(rulez)
                    console.log(JSON.stringify(result));
                    
                    var processThreads = [];

                    for (const violationRulesByResourceType of result) {
                        
                        //figure out why this is broken
                        if (JSON.stringify(violationRulesByResourceType) !== '{}' && Object.keys(violationRulesByResourceType).length > 0 && violationRulesByResourceType.hasOwnProperty("aws_resource_type")) {
                            console.log(`inside loop ${JSON.stringify(violationRulesByResourceType)}`);
                            const resourceType = violationRulesByResourceType.aws_resource_type;
                            const resources = parsedResources[resourceType];
                            const resourceNames = Object.keys(resources);
            
                            for (const rn of resourceNames) {
                                // should be Promise.allSettled
                                processThreads.push(processResource(resources[rn], violationRulesByResourceType, resourceType, rn));
                                console.log(`Completed processing of ${rn}`);
                            }
                        }
                        
                    }
                    console.log("process Threads: " + processThreads);
                    return processThreads;

                }).catch((err) => setImmediate(() => { throw err; }));


        //         }
        //     }
        // )

        
        
        Promise.allSettled(pThreads).then( async () => {
            console.log("pThreads: " + pThreads);

            const result = {
                errors: errorsEncountered,
                violations: violationsFound,
            };
            console.log(`result: ${JSON.stringify(result)}`);
            console.log("dir: " + dir);
            const writePath = dir + "/result_" + fileName;
    
            console.log("writing to " + writePath);
            fs.writeFileSync(writePath, result);
            console.log("wrote " + writePath);
            // return callback(null, responseComplete);

            console.log(result.violations);
            console.log(result.violations[0]);

            const user = await getIdFromDB(username);

            console.log(user);
            console.log(user.email);

            const v = {"userId": user.userId,    //"105966689851359954303",
                        "repoId":repo,
                        "prId": prId,
                        "filePath": "path",
                        "lineNumber":result.violations[0].lineNumber,
                        "ruleId": result.violations[0].violationRuleId,
                        "prTime": prDate,
                        "dateFound": result.violations[0].dateFound};

            
            sendViolationsToDB(v); 
            let statVal = "pass";
            let errCount = 0;

            if (result.violations.length > 0) {
                statVal = "fail"
                errCount = result.violations.length;
            }

            let emailPayload = {
                name: username,           // name of recipient
                address: user.email,
                statVal: statVal,        // pass/fail/error
                errCount: errCount,       // number of violations
                repoName: repo        // name of pr repo
            }
        
            invokeLambda(emailLambdaName, emailPayload);

        })
        // const response = {
        //     statusCode: 200,
        //     headers: { 'Content-Type': 'application/json' },
        //     body: result
        // }
    
        
    } catch (e) {
        //const invalidTerraformFileError = new InvalidTerraformFileError(file.githubFullPath, e);
        console.log("error");
        addError("invalidTerraformFileError");
    } finally {
        
    }
};

function getRules(con, queryString)
{
    return new Promise(function(resolve, reject) {

        let rulez = [];
        con.query(
            queryString,
            function (err, result) {
                if (err) {
                    console.log("error from db");
                    throw err;
                }

                con.end();
                resolve(result);

            });
    });
}

function sendViolationsToDB(violation) {

    console.log("sending a violation to db");
    // console.log(violation);

    const v = {"userId":"105966689851359954303","repoId":"Group4Test","prId":"788555280","filePath":"path","lineNumber":1,"ruleId":1,"prTime":"TBA","dateFound":1637827484447};

    const url = `https://juaqm4a9j6.execute-api.us-east-1.amazonaws.com/dev/violations`;
    return axios.post(url, v)
        .then((res) => {
            console.log(res.data);
            return res.data;
    }).catch((err) => {
        console.log(err);
    });
}

async function getIdFromDB(username) {

    console.log(`requesting email from database for ${username}`);
  
    const db_url = `https://juaqm4a9j6.execute-api.us-east-1.amazonaws.com/dev/users/?username=${username}`;
    return axios.get(db_url).then((res) => {
        console.log(res.data);
        return res.data;
    });
  }