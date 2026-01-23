// File: src/routes/visitor.routes.js
// Description: Routes for public searching and private history viewing.

const express = require('express');
const router = express.Router();
const VisitorController = require('../controllers/visitor.controller');
const auth = require('../middleware/auth');

// ==========================================
// 🌍 PUBLIC ROUTES (No Token Needed)
// ==========================================

/**
 * @route   POST /api/visitor/search
 * @desc    Public user searches for a car status by Device UID.
 * Must provide name & email.
 */
router.post('/search', VisitorController.searchDevice);


// ==========================================
// 🔒 PROTECTED ROUTES (Token Required)
// ==========================================

/**
 * @route   GET /api/visitor/history
 * @desc    Logged-in User views list of people who searched for their devices.
 */
router.get('/history', auth, VisitorController.getMySearchHistory);

module.exports = router;