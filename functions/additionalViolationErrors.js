class InvalidTerraformFileError extends Error {
    constructor(fileFullPath, errorMessage) {
        super(
          `Error parsing Terraform file ${fileFullPath} to JSON object: ${errorMessage}`
        );
    }
}

class LineNumberNotFoundError extends Error {
    constructor(fileFullPath, searchContent) {
        super(
            `Error finding line number with regex '${searchContent}' inside of ${fileFullPath}`
        );
    }
}

class GrepError extends Error {
    constructor(fileFullPath, searchContent, errorMessage) {
        super(
            `Error occured while running grep to find line number with regex '${searchContent} inside of ${fileFullPath}: ${errorMessage}`
        );
    }
}