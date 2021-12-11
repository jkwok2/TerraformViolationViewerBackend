
const connection = require('serverless-mysql')({
  config: {
    host: 'database-1.cphcofv6hw3s.us-east-1.rds.amazonaws.com',
    database: 'database-1',
    user: 'admin',
    password: 'cpsc319aws!',
  },
});

module.exports = connection;
