// File: src/routes/devices.routes.js
// Description: Defines API endpoints for Device management.

const express = require('express');
const router = express.Router();
const DevicesController = require('../controllers/devices.controller');
const auth = require('../middleware/auth');

// Apply 'auth' middleware to all routes (Protection)
router.use(auth);

// --- Create ---
router.post('/', DevicesController.addDevice);

// --- Read ---
router.get('/', DevicesController.getAllDevices);

// Note: Ensure specific paths come before generic /:id param to avoid conflicts
router.get('/uid/:uid', DevicesController.getDeviceByUid); // Lookup by UID string
router.get('/:id', DevicesController.getDeviceById);       // Lookup by DB ID

// --- Update ---
router.put('/:id', DevicesController.updateDevice);

// --- Delete ---
router.delete('/:id', DevicesController.deleteDevice);

module.exports = router;