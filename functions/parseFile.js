var aws = require('aws-sdk');
const fs = require('fs')
const hcltojson = require('hcl-to-json');
const { InvalidTerraformFileError, LineNumberNotFoundError, GrepError } = require("./additionalViolationErrors");

// const invokeLambda = require('functions/utilities/invokeLambda.js');
// const writeFileLambdaName = 'hsbc-backend-app-meg-dev-writeFile';

aws.config.region = process.region;
const spawn = require('child_process').spawn;
let violationsFound;
let errorsEncountered;
const file = {
    content: "",
    efsFullPath: "",
    githubFullPath: "",
};

const grepWithShell = async(grepSearch) => {
    const child = spawn('grep', ['-n -E', grepSearch, file.content]);
    let res = '';
    child.stdout.on('data', (buffer) => { res += buffer.toString(); });
    child.stdout.on('end', () => {});
    return res;
};

const getLineNumber = async(resourceType, resourceName) => {
    return 1;
    // console.log(`Inside getLineNumber with resourceType: ${resourceType}, resourceName: ${resourceName}`);
    // const grepSearch = `resource +"${resourceType}" +"${resourceName}"`;
    // console.log(`grepSearch: ${grepSearch}`);
    // try{
    //     const lines = await grepWithShell(grepSearch);
    //     if (lines === "") {
    //         //violationsFound.push(new Violation(DEFAULT_VIOLATION_ID, LINE_NUMBER_NOT_FOUND, DEFAULT_VIOLATION_LINE_NUMBER, resourceType, resourceName));
    //         console.log(`lines === "", error thrown`);
    //         const parseError = new LineNumberNotFoundError(file.githubFullPath, grepSearch);
    //         addError(parseError);
    //     }
    //     const lineNumber = lines.split(":")[0];
    //     console.log(`lineNumber: ${lineNumber}`);
    //     if (Number.isInteger(lineNumber)) return lineNumber;
    //     console.log(`lineNumber is not a number, error thrown`);
    //     const grepError = new GrepError(file.githubFullPath, grepSearch, `Unexpected value returned from line search: ${lines}`);
    //     addError(grepError);
    // } catch (e) {
    //     console.log(`error caught in getLineNumber`);
    //     if (e instanceof LineNumberNotFoundError || e instanceof GrepError) throw e;
    //     else {
    //         //violationsFound.push(new Violation(DEFAULT_VIOLATION_ID, GREP_ERROR, DEFAULT_VIOLATION_LINE_NUMBER, resourceType, resourceName));
    //         const grepError =  new GrepError(file.githubFullPath, grepSearch, e);
    //         addError(grepError);
    //         throw grepError;
    //     }
    // }
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
    errorsEncountered.push(e.prototype.toString());
    console.log(`Error encountered at ${file.efsFullPath}: ${JSON.stringify(e)}`);
    throw e;
}

const addViolation = async(violationRule, resourceType, resourceName) => {
    console.log(`Inside addViolation with violationRule: ${violationRule}, resourceType: ${resourceType}, resourceName: ${resourceName}`);
    try {
        const lineNumber = await getLineNumber(resourceType, resourceName);
        const violation = {violationId: violationRule.id, 
                            severity: violationRule.severity,
                            category: violationRule.category,
                            lineNumber: lineNumber,
                            resourceType: resourceType,
                            resourceName: resourceName
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

    console.log(`start reading file ${fileName}`);
    console.log(`start reading file ${filePath}`);

    // hacky way to get around race condition if file doesn't exist in EFS yet
    var fileNotFound = true;
    var terraformFile;
    while (fileNotFound) {
        if (fs.existsSync(filePath)) {
            const tempFile = fs.readFileSync(filePath, {encoding: 'utf8'});
            console.log(tempFile);
            terraformFile = Buffer.from(tempFile, 'base64').toString('ascii');
            fileNotFound = false;
            // const buff = new Buffer(terraformFile, "base64");
            // const text = buff.toString("ascii");
            // const buf = Buffer.from(terraformFile, "base64");
            // const text = buf.toString("ascii");
            console.log("done reading file " + fileName);
            console.log(`Terraform file read: ${terraformFile}`);
        }
    }

    file.content = terraformFile;
    file.efsFullPath = filePath;
    file.githubFullPath = githubFullPath;
    Object.freeze(file);

    try {
        const parsedTerraformFile = hcltojson(terraformFile);
        console.log(`Terraform file ${fileName} parsed successfully as ${JSON.stringify(parsedTerraformFile)}`);
        
        console.log(`Are there resources? ${parsedTerraformFile.hasOwnProperty("resource")}`);
        if (parsedTerraformFile.hasOwnProperty("resource")) {
            const parsedResources = parsedTerraformFile.resource;
            const resourceTypes = Object.keys(parsedResources);
            console.log(`The AWS Resource Types in this file are ${JSON.stringify(resourceTypes)}`);
            // TODO: This will be populated with relevant violation rules (resourceTypes)
            const violationRules = [
                {
                    "aws_resource_type": "aws_athena_workgroup",
                    "has": [
                        {
                            "id": "athena",
                            "resource": "aws_athena_workgroup",
                            "category": "GENERAL",
                            "severity": "MEDIUM",
                            "key": "configuration.result_configuration.encryption_configuration"
                        }
                    ]
                },
                {
                    "aws_resource_type": "aws_security_group",
                    "has": [
                        {
                            "id": "security_2",
                            "category": "NETWORKING",
                            "severity": "LOW",
                            "key": "ingress.description"
                        }
                    ],
                    "not_has": [
                        {
                            "id": "security_1",
                            "category": "NETWORKING",
                            "severity": "MEDIUM",
                            "key": "ingress.cidr_blocks",
                            "value": "0.0.0.0/0"
                        }
                    ]
                },
                {
                    "aws_resource_type": "aws_cloudfront_distribution",
                    "has": [
                        {
                            "id": "cloudfront",
                            "category": "NETWORKING",
                            "severity": "MEDIUM",
                            "key": "default_cache_behavior.viewer_protocol_policy",
                            "range": [
                                "redirect-to-https",
                                "https-only"
                            ]
                        }
                    ]
                },
            ]; 

            //const processThreads = [];

            for (const violationRulesByResourceType of violationRules) {
                const resourceType = violationRulesByResourceType.aws_resource_type;
                const resources = parsedResources[resourceType];
                const resourceNames = Object.keys(resources);

                for (const rn of resourceNames) {
                    await processResource(resources[rn], violationRulesByResourceType, resourceType, rn);
                    console.log(`Completed processing of ${rn}`);
                }
                // resourceNames.forEach(rn => {
                //     await processThreads.put(processResource(resources[rn], violationRulesByResourceType, resourceType, rn));
                // });
            }

            // violationRules.forEach(violationRulesByResourceType => {
            //     const resourceType = violationRulesByResourceType.aws_resource_type;
            //     const resources = parsedResources[resourceType];
            //     const resourceNames = Object.keys(resources);
            //     resourceNames.forEach(rn => {
            //         await processThreads.put(processResource(resources[rn], violationRulesByResourceType, resourceType, rn));
            //     });
            // });
            //await Promise.all(processThreads);
        }
        
    } catch (e) {
        const invalidTerraformFileError = new InvalidTerraformFileError(file.githubFullPath, e);
        addError(invalidTerraformFileError);
    } finally {
        const result = {
            errors: errorsEncountered,
            violations: violationsFound,
        };

        console.log("dir: " + dir);
        const writePath = dir + "/result_" + fileName;

        console.log("writing to " + writePath);
        fs.writeFileSync(writePath, result);
        console.log("wrote " + writePath);
    }
};