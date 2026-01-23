// File: src/routes/audit.routes.js

const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/audit.controller');
const auth = require('../middleware/auth');

// Protected Routes (Admin Only)
router.use(auth);

// TODO: Add middleware to check if role === 'admin' specifically if needed
// For now, any authenticated user with token can access (assuming only admins have dashboard access)

/**
 * @route   GET /api/audit
 * @desc    Get full history of admin changes
 * @access  Private (Admin)
 */
router.get('/', AuditController.getLogs);

module.exports = router;