var aws = require('aws-sdk');
const fs = require('fs')
const hcltojson = require('hcl-to-json');
const { InvalidTerraformFileError, LineNumberNotFoundError, GrepError } = require("./additionalViolationErrors");

const invokeLambda = require('functions/utilities/invokeLambda.js');
const writeFileLambdaName = 'hsbc-backend-app-meg-dev-writeFile';

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
    const grepSearch = `resource +"${resourceType}" +"${resourceName}"`;
    try{
        const lines = await grepWithShell(grepSearch);
        if (lines === "") {
            //violationsFound.push(new Violation(DEFAULT_VIOLATION_ID, LINE_NUMBER_NOT_FOUND, DEFAULT_VIOLATION_LINE_NUMBER, resourceType, resourceName));
            const parseError = new LineNumberNotFoundError(file.githubFullPath, grepSearch);
            addError(parseError);
        }
        const lineNumber = lines.split(":")[0];
        if (Number.isInteger(lineNumber)) return lineNumber;
        const grepError = new GrepError(file.githubFullPath, grepSearch, `Unexpected value returned from line search: ${lines}`);
        addError(grepError);
    } catch (e) {
        if (e instanceof LineNumberNotFoundError || e instanceof GrepError) throw e;
        else {
            //violationsFound.push(new Violation(DEFAULT_VIOLATION_ID, GREP_ERROR, DEFAULT_VIOLATION_LINE_NUMBER, resourceType, resourceName));
            const grepError =  new GrepError(file.githubFullPath, grepSearch, e);
            addError(grepError);
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
    errorsEncountered.push(e.prototype.toString());
    console.log(`Error encountered at ${file.efsFullPath}: ${JSON.stringify(e)}`);
    throw e;
}

const addViolation = async(violationRule, resourceType, resourceName) => {
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
    if (!hasProperty(hasViolationRule, "key")) return;
    try {
        // check if key is in resource
        if (!hasProperty(resource, hasViolationRule.key)) {
            addViolation(hasViolationRule, resourceType, resourceName);
            return;
        }
        // if checking for value, see if they match
        if (hasProperty(hasViolationRule, "value")) {
            if (getPropertyValue(resource, hasViolationRule.key) !== hasViolationRule.value) {
                addViolation(hasViolationRule, resourceType, resourceName);
            }
            return;
        }
        // if checking for range, see if they match
        if (hasViolationRule.hasOwnProperty("range")) {
            const rangeValues = hasViolationRule.range;
            const value = getPropertyValue(resource, hasViolationRule.key);
            if (!rangeValues.some(v => v === value)) {
                addViolation(hasViolationRule, resourceType, resourceName);
            }
            return;
        }
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
            terraformFile = fs.readFileSync(filePath);
            fileNotFound = false;
            console.log("done reading file " + fileName);
            // console.log(`Terraform file read: ${terraformFile}`);
        }
    }

    file.content = terraformFile;
    file.efsFullPath = filePath;
    file.githubFullPath = githubFullPath;
    Object.freeze(file);

    try {
        const parsedTerraformFile = hcltojson(terraformFile);
        console.log(`Terraform file ${fileName} parsed successfully`);
        
        if (parsedTerraformFile.hasOwnProperty('resource')) {
            const parsedResources = parsedTerraformFile.resource;
            const resourceTypes = Object.keys(parsedResources);

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

            violationRules.forEach(violationRulesByResourceType => {
                const resourceType = violationRulesByResourceType.aws_resource_type;
                const resources = parsedResources[resourceType];
                const resourceNames = Object.keys(resources);
                resourceNames.forEach(rn => {
                    processResource(resources[rn], violationRulesByResourceType, resourceType, rn);
                })
            })
        }
        
    } catch (e) {
        const invalidTerraformFileError = new InvalidTerraformFileError(file.githubFullPath, e);
        addError(invalidTerraformFileError);
    } finally {
        const result = {
            errors: errorsEncountered,
            violations: violationsFound,
        }

        console.log("dir: " + dir);
        const writePath = dir + "/result_" + fileName;


        // console.log("(lambda) writing to  " + dir + "/" + fileName);
        // invokeLambda(writeFileLambdaName, {fileName: "lambda_result_" + fileName, 
        //                                     content: result, 
        //                                     dir: dir} );
        // console.log("lambda call done");


        console.log("writing to " + writePath);
        fs.writeFileSync(writePath, result);
        console.log("wrote " + writePath);
    }
};