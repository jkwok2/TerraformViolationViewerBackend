const mysql = require('mysql2/promise');
const config = {
  connectionLimit: 100,
  host: 'database-1.cphcofv6hw3s.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'cpsc319aws!',
};

function initializeConnection() {
  const connection = mysql.createPool(config);
  return connection;
}

module.exports = initializeConnection;
