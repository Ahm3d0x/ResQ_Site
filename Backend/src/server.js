/**
 * src/server.js
 * * * Server Entry Point
 * This file acts as the main entry point for the backend application.
 * It is responsible for:
 * 1. Starting the HTTP server.
 * 2. Initializing the Socket.io real-time engine.
 * 3. Connecting the Express App with the Server.
 * 4. Handling global process errors (Safety Net).
 */

const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config(); // Load environment variables from .env

// Import the configured Express application
const app = require('./app');

// Import Database Pool (To ensure DB is connected before server starts)
const db = require('./config/db');

// Define the server port (Default to 3000 if not specified in .env)
const PORT = process.env.PORT || 3000;

// =========================================================
// 1. HTTP Server Initialization
// =========================================================
// We use the native Node.js HTTP module to wrap the Express app.
// This is necessary to attach Socket.io to the same server instance.
const server = http.createServer(app);

// =========================================================
// 2. Socket.io Real-Time Layer Setup
// =========================================================
// Initialize Socket.io with Cross-Origin Resource Sharing (CORS) enabled.
// This allows the Frontend to connect via WebSockets.
const io = new Server(server, {
    cors: {
        // In development, '*' allows connections from any domain.
        // In production, strictly replace this with the frontend URL.
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Make the 'io' instance accessible globally via the Express app.
// This allows Controllers/Services to emit events (e.g., req.app.get('io').emit(...)).
app.set('io', io);

// =========================================================
// 3. Socket Event Listeners (Global)
// =========================================================
const socketManager = require('./sockets/socketManager');

// Pass the 'io' instance to the manager to handle events
socketManager.initSocket(io);

// =========================================================
// 4. Start the Server
// =========================================================
// Listen on the specified port and log the success message.
server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 ResQ Server is running successfully!`);
    console.log(`🔌 Port: \t${PORT}`);
    console.log(`🔗 Local URL: \thttp://localhost:${PORT}`);
    console.log(`==================================================\n`);
});

// =========================================================
// 5. Global Safety Nets (Process Handling)
// =========================================================

// Handle Unhandled Promise Rejections (e.g., failed async DB calls without catch)
process.on('unhandledRejection', (err) => {
    console.error('🔥 CRITICAL ERROR: Unhandled Rejection! Shutting down...');
    console.error(err.name, err.message);
    // Close server gracefully before exiting
    server.close(() => {
        process.exit(1);
    });
});

// Handle Uncaught Exceptions (e.g., synchronous code errors)
process.on('uncaughtException', (err) => {
    console.error('🔥 CRITICAL ERROR: Uncaught Exception! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});