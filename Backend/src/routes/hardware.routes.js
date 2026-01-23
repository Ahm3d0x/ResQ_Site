// File: src/routes/hardware.routes.js

const express = require('express');
const router = express.Router();
const HardwareController = require('../controllers/hardware.controller');
// ملاحظة: قد لا نستخدم auth middleware هنا إذا كان الجهاز لا يملك توكن مستخدم، 
// ولكن نعتمد على device_uid كـ "API Key"

/**
 * @route   POST /api/hardware/event
 * @desc    Log generic hardware events (heartbeat, status)
 * @access  Public (Validated by device_uid)
 */
router.post('/event', HardwareController.logEvent);

module.exports = router;