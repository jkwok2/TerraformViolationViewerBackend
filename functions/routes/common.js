// const mysql = require('mysql2/promise');
const connection = require('serverless-mysql')({
  config: {
    host: 'database-1.cphcofv6hw3s.us-east-1.rds.amazonaws.com',
    database: 'database-1',
    user: 'admin',
    password: 'cpsc319aws!',
  },
});
// const config = {
//   connectionLimit: 100,
//   host: 'database-1.cphcofv6hw3s.us-east-1.rds.amazonaws.com',
//   user: 'admin',
//   password: 'cpsc319aws!',
// };

// function initializeConnection() {
//   const connection = mysql.createPool(config);
//   return connection;
// }

// module.exports = initializeConnection;
module.exports = connection;
