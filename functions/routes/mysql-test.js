const mysql = require('mysql');

const con = mysql.createConnection({
  host: 'database-1.cphcofv6hw3s.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'cpsc319aws!',
});

con.connect(function (err) {
  if (err) throw err;
  console.log('Connected!');
  con.query('CREATE DATABASE IF NOT EXISTS `database-1`;');
  con.query('USE `database-1`;');
  // con.query(
  //   'CREATE TABLE IF NOT EXISTS violations(id int NOT NULL AUTO_INCREMENT, userId varchar(30), repoId varchar(255), prId varchar(255), type varchar(30), PRIMARY KEY(id));',
  //   function (error, result, fields) {
  //     console.log(`error running query: ${error}`);
  //   }
  // );
  con.query(
    'CREATE TABLE IF NOT EXISTS users(id int NOT NULL AUTO_INCREMENT, username varchar(30), email varchar(255), age int, PRIMARY KEY(id));',
    function (error, result, fields) {
      console.log(error);
    }
  );
  con.end();
});
