// File: src/routes/settings.routes.js

const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settings.controller');
const auth = require('../middleware/auth');

// Protect all routes with Token Authentication
router.use(auth);

/**
 * @route   GET /api/settings
 * @desc    Get all system configurations
 * @access  Admin Only
 */
router.get('/', SettingsController.getAllSettings);

/**
 * @route   PUT /api/settings/:key
 * @desc    Update a specific configuration value
 * @access  Admin Only
 */
router.put('/:key', SettingsController.updateSetting);

module.exports = router;