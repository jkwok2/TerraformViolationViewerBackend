const mysql = require('mysql');
const config = {
  connectionLimit: 100,
  host: 'database-1.cphcofv6hw3s.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'cpsc319aws!',
};

// function initializeConnection() {
//   function addDisconnectHandler(connection) {
//     connection.on('error', function (error) {
//       if (error instanceof Error) {
//         if (error.code === 'PROTOCOL_CONNECTION_LOST') {
//           console.error(error.stack);
//           console.log('Lost connection. Reconnecting...');
//           initializeConnection(config);
//         } else {
//           throw error;
//         }
//       }
//     });
//   }

//   const connection = mysql.createConnection(config);

//   // Add handlers.
//   addDisconnectHandler(connection);
//   // connection.query('SET GLOBAL connect_timeout=7200');
//   // connection.query('SET GLOBAL interactive_timeout=7200');
//   // connection.query('SET GLOBAL wait_timeout=7200');

//   connection.connect();
//   connection.query('SET GLOBAL connect_timeout=7200');
//   connection.query('SET GLOBAL interactive_timeout=7200');
//   connection.query('SET GLOBAL wait_timeout=7200');
//   return connection;
// }

function initializeConnection() {
  const connection = mysql.createPool(config);
  return connection;
}

module.exports = initializeConnection;



