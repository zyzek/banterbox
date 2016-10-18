var pg = require('pg-promise')({promiseLib:Promise})

// Make sure postgres variables are stored correctly in the .env file
var dotenv = require('dotenv').config({path: '../.env'})


var db_credentials = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
}


/**
 * Helper method to get a postgres connection loaded with credentials
 */
function connection() {
  return pg(db_credentials)
}


module.exports = {
  connection
}

