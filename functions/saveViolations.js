const connection = require('serverless-mysql')({
    config: {
        host: 'database-1.cphcofv6hw3s.us-east-1.rds.amazonaws.com',
        database: 'database-1',
        user: 'admin',
        password: 'cpsc319aws!',
    },
});

module.exports.saveViolations = async (event, context, callback) => {
    try {
        console.log('saving violation: ', event.violations);
        context.callbackWaitsForEmptyEventLoop = false;
        
        const violations = event.violations;
        const path = event.path;

        await Promise.all(
            violations.map(async (violation) => {
                try {
                    const result = await connection.query(
                        `Insert into \`database-1\`.\`Violations\` (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('${violation.userId}', '${violation.repoId}', '${violation.prId}', '${violation.filePath}', '${violation.lineNumber}', '${violation.ruleId}', '${violation.prTime}', '${violation.dateFound}')`
                    );
                    console.log('inserted violation successfully');
                } catch (err) {
                    console.log(`${path}: error when inserting violation.`);
                    console.error(`${err}`);
                    throw err;
                }
            })
        );

        console.log(`${path}: Finished inserting ${violations.length} into database`);

        const response = {
            statusCode: 200,
            body: JSON.stringify({
                input: event,
            }),
        };
        await connection.end();
        return callback(null, response);
    } catch (err) {
        await connection.end();
        return callback(err, {
            statusCode: 401,
            headers: { 'Content-Type': 'text/plain' },
            body: err,
        });
    }
};