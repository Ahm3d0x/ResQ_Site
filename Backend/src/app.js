/**
 * src/app.js
 * * * Core Application Configuration
 * This file is responsible for configuring the Express application instance.
 * It strictly separates the "App configuration" from the "Server startup" logic.
 * * Responsibilities:
 * 1. Load Global Middlewares (Security, Logging, Parsing).
 * 2. Setup Language/Localization detection.
 * 3. Mount API Routes.
 * 4. Handle Global Errors (404 & 500).
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Initialize the Express application
const app = express();

// =========================================================
// 1. Global Middlewares (The Gatekeepers)
// =========================================================

// Security Middleware: Helmet sets various HTTP headers to secure the app against common vulnerabilities.
app.use(helmet());

// CORS Middleware: Controls who can access this API.
// "origin: '*'" allows all for development. In production, this should be restricted to the frontend domain.
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language']
}));

// Logger Middleware: Logs details of every incoming request (Method, URL, Status, Time).
// Essential for debugging and monitoring system activity.
app.use(morgan('dev'));

// Body Parser: Allows the server to accept and understand JSON data sent in requests (e.g., from hardware or frontend).
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// =========================================================
// 2. Localization Setup (Language Support)
// =========================================================

// Middleware to detect user's preferred language.
// It checks the 'Accept-Language' header or 'lang' query parameter.
// Default fallback is English ('en').
app.use((req, res, next) => {
    const langHeader = req.headers['accept-language'];
    const langQuery = req.query.lang;
    
    // Logic: If 'ar' is found in header or query, set language to 'ar', otherwise 'en'.
    // This 'req.lang' property will be available in all Controllers later.
    req.lang = (langHeader && langHeader.includes('ar')) || (langQuery === 'ar') ? 'ar' : 'en';
    
    next();
});

// =========================================================
// 3. API Routes Mounting
// =========================================================

// Import Routes
const userRoutes = require('./routes/users.routes');
const deviceRoutes = require('./routes/devices.routes'); 
const ambulanceRoutes = require('./routes/ambulances.routes');
const hospitalsRoutes = require('./routes/hospitals.routes');
const auditRoutes = require('./routes/audit.routes');
app.use('/api/hardware', require('./routes/hardware.routes'))
app.use('/api/incidents', require('./routes/incidents.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/visitors', require('./routes/visitor.routes'));
// Mount Routes
// Any request starting with '/api/users' will be forwarded to the User Routes
// Example: http://localhost:3000/api/users/register
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes); 
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/hospitals', hospitalsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/hardware', require('./routes/hardware.routes'));
app.use('/api/incidents', require('./routes/incidents.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/visitor', require('./routes/visitor.routes'));

// Basic Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'ResQ Backend System is Online 🚑',
        language_detected: req.lang,
        timestamp: new Date().toISOString()
    });
});


// =========================================================
// 4. Centralized Error Handling (Safety Net)
// =========================================================

// 404 Handler: Catches any request that matches no defined route.
app.use((req, res, next) => {
    const error = new Error(`Resource not found - ${req.originalUrl}`);
    error.status = 404;
    next(error); // Pass error to the next middleware (Global Error Handler)
});

// Global Error Handler: The final destination for ALL errors in the system.
// Instead of crashing the server, it catches the error and sends a clean JSON response.
app.use((err, req, res, next) => {
    // Log the error to the console (Server-side)
    console.error(`🔥 System Error: ${err.message}`);

    // Determine the status code (default to 500 Internal Server Error)
    const statusCode = err.status || 500;

    // Send the response to the client
    res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: err.message || 'Internal Server Error',
        // Stack trace is sent only in development mode for debugging purposes
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Export the configured app to be used by server.js
module.exports = app;