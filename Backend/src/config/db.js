/**
 * src/config/db.js
 * * This file configures the MySQL database connection using a connection pool.
 * It handles connection events, errors, and provides a promise-based interface
 * for executing queries throughout the application.
 */

const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Database configuration object
// Prepared for high load and easy debugging
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'resq',
    port: process.env.DB_PORT || 3306,
    
    // Pool Settings (Performance & Stability)
    waitForConnections: true, // Queue requests when the pool is full instead of rejecting them immediately
    connectionLimit: 10,      // Maximum number of concurrent connections allowed (Adjust based on server capacity)
    queueLimit: 0,            // Unlimited queue size (0 means no limit)
    
    // Data Handling Settings
    dateStrings: true,        // Return dates as strings to prevent automatic JavaScript timezone conversion issues
    multipleStatements: false, // Security: Disable execution of multiple statements in one query to prevent SQL Injection
    timezone: 'local'         // Use the server's local timezone for dates
};

// Create the connection pool
const pool = mysql.createPool(dbConfig);

// =========================================================
// Logging & Monitoring Events
// =========================================================

// Event triggered when a new connection is established
pool.on('connection', (connection) => {
    console.log(`🔌 DB Connection established (Thread ID: ${connection.threadId})`);
});

// Event triggered when a connection error occurs in the pool
pool.on('error', (err) => {
    console.error('❌ Unexpected DB Error:', err.code); 
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('⚠️ Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('⚠️ Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
        console.error('⚠️ Database connection was refused.');
    }
});

// =========================================================
// Export Promise-based Interface
// =========================================================

// Convert pool to support async/await (Promises)
const promisePool = pool.promise();

/**
 * Validates the database connection upon server startup.
 * Exits the process if the connection fails (Fail Fast Strategy).
 */
async function testConnection() {
    try {
        const [rows] = await promisePool.query('SELECT 1 as val');
        if (rows[0].val === 1) {
            console.log('✅ Database Connection Verified & Ready.');
        }
    } catch (err) {
        console.error('🔥 CRITICAL: Database Connection Failed!');
        console.error('Details:', err.message);
        // Stop the server if the DB is down, as the app cannot function without it.
        process.exit(1); 
    }
}

// Execute the connection test
testConnection();

// Export the promise-pool to be used in controllers and services
module.exports = promisePool;