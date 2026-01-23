// File: src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/users.controller');
const auth = require('../middleware/auth'); 

// Public
router.post('/register', UsersController.register);
router.post('/login', UsersController.login);

// Protected
router.use(auth);

// User Self-Management
router.get('/profile', UsersController.getProfile);
router.put('/change-password', UsersController.changePassword); // User changes their own pass (requires old pass)

// --- Admin Management ---
router.get('/', UsersController.getAllUsers);           // List All
router.get('/:id', UsersController.getUserById);        // 🔥 Get One (Admin)

router.put('/:id', UsersController.updateUser);         // Update Info
router.put('/:id/reset-password', UsersController.resetUserPassword); // 🔥 Force Reset (Admin)

router.delete('/:id', UsersController.deleteUser);      // Delete

module.exports = router;