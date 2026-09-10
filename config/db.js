const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  override: true
});
const mysql = require('mysql2/promise');

// Validate required environment variables
const requiredEnvVars = ['DB_USER', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(' DB_HOST=127.0.0.1');
  console.error(' DB_PORT=3306');
  console.error(' DB_USER=root');
  console.error(' DB_PASSWORD=my_password');
  console.error(' DB_NAME=my_database_name');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection error:', err.message);

  });

module.exports = pool;