const connection = require('./routes/common');

module.exports.saveViolations = async (event, context, callback) => {
    try {
        console.log('saving violation: ', event.violations);

        const violations = event.violations;

        await Promise.all(
            violations.map(async (violation) => {
                try {
                    const result = await connection.query(
                        `Insert into \`database-1\`.\`Violations\` (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('${violation.userId}', '${violation.repoId}', '${violation.prId}', '${violation.filePath}', '${violation.lineNumber}', '${violation.ruleId}', '${violation.prTime}', '${violation.dateFound}')`
                    );
                    console.log('inserted violation: ', { result });
                } catch (err) {
                    console.log('error when inserting violation: ', { err });
                }
            })
        );


    //     const result = await connection.query(
    //         `Insert into \`database-1\`.\`Violations\` (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('${violation.userId}', '${violation.repoId}', '${violation.prId}', '${violation.filePath}', '${violation.lineNumber}', '${violation.ruleId}', '${violation.prTime}', '${violation.dateFound}')`
    // );
        console.log('saved violation result to db: ');

        const response = {
            statusCode: 200,
            body: JSON.stringify({
                input: event,
            }),
        };

        return callback(null, response);
    } catch (err) {
        return callback(err, {
            statusCode: 401,
            headers: { 'Content-Type': 'text/plain' },
            body: err,
        });
    }
};