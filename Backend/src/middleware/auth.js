/**
 * src/middleware/auth.js
 * * Authentication Middleware
 * This middleware intercepts incoming requests to protected routes.
 * It checks for a valid JWT token in the 'Authorization' header.
 * If valid, it attaches the user payload to 'req.user' and allows the request to proceed.
 * If invalid or missing, it blocks the request immediately.
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
    try {
        // 1. Check for Authorization header
        // Expected format: "Bearer <token>"
        const authHeader = req.headers['authorization'];
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Access Denied. No token provided.'
            });
        }

        // 2. Extract the token
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Access Denied. Token is missing.'
            });
        }

        // 3. Verify the token
        // If verification fails, it throws an error which goes to the catch block
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Attach user info to request
        // Now 'req.user' (contains id, role) is available in any route that uses this middleware
        req.user = decoded;
        
        // 5. Proceed to the next middleware or controller
        next();

    } catch (error) {
        // Handle invalid or expired tokens
        return res.status(403).json({
            status: 'error',
            message: 'Invalid or Expired Token.'
        });
    }
};

module.exports = auth;