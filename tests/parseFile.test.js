const parseFile = require("../functions/parseFile");

const COMPLEX_OBJ_G = {
    "h": "i",
    "j": "k"
};

const COMPLEX_OBJ_A = {
    "b": {
        "c": "d"
    },
    "e": "f",
    "g": COMPLEX_OBJ_G
};

const COMPLEX_OBJ = {
    "a": COMPLEX_OBJ_A 
};

describe ('parseFile hasProperty', () => {
    it ('simple case first level', async() => {
        const response = parseFile.hasProperty(COMPLEX_OBJ, "a");
        expect(response).toBe(true);
    });

    it ('complex case nested', async() => {
        const responseB = parseFile.hasProperty(COMPLEX_OBJ, "a.b");
        expect(responseB).toBe(true);
        
        const responseJ = parseFile.hasProperty(COMPLEX_OBJ, "j");
        expect(responseJ).toBe(false);

        const responseI = parseFile.hasProperty(COMPLEX_OBJ, "i");
        expect(responseI).toBe(false);
    });

    it ('empty case', async() => {
        const obj = {};
        const response = parseFile.hasProperty(obj, "as.be");
        expect(response).toBe(false);
    })
});

describe ('parseFile getPropertyValue', () => {
    it ('simple case first level', async() => {
        const response = await parseFile.getPropertyValue(COMPLEX_OBJ, "a");
        expect(response).toBe(COMPLEX_OBJ_A);
    });

    it ('complex case nexted', async() => {
        const responseH = await parseFile.getPropertyValue(COMPLEX_OBJ, "a.g.h");
        expect(responseH).toBe("i");

        const responseG = await parseFile.getPropertyValue(COMPLEX_OBJ, "a.g");
        expect(responseG).toBe(COMPLEX_OBJ_G);
    });
});


describe ('parseFile getLineNumber', () => {
    const file = {
        content: 'resource "aws-lambda" "example" \n words available \n some extra char resource "aws-dynamodb" "example2"',
        path: "github/a/b/c.tf"
    };

    it ('simple get resource first line from file', () => {
        const violation = {
            violationRuleId: 1,
            filePath: "a/path.tf",
            lineNumber: -1,
            dateFound: "a date",
            resourceType: "aws-lambda",
            resourceName: "example"
        };
        
        expect(parseFile.getLineNumber(violation.resourceType, violation.resourceName, file)).toBe(1);
    });

    it ('simple get resource from file', () => {
        const violation = {
            violationRuleId: 1,
            filePath: "a/path.tf",
            lineNumber: -1,
            dateFound: "a date",
            resourceType: "aws-dynamodb",
            resourceName: "example2"
        };
        expect(parseFile.getLineNumber(violation.resourceType, violation.resourceName, file)).toBe(3);
    });

    it ('resource does not exist in file', () => {
        const violation = {
            violationRuleId: 1,
            filePath: "a/path.tf",
            lineNumber: -1,
            dateFound: "a date",
            resourceType: "aws-not-exist",
            resourceName: "example2"
        };
        expect(parseFile.getLineNumber(violation.resourceType, violation.resourceName, file)).toBe(-1);
    });
});