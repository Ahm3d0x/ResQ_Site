// File: src/routes/ambulances.routes.js

const express = require('express');
const router = express.Router();
const AmbulancesController = require('../controllers/ambulances.controller');
const auth = require('../middleware/auth');

// Protected Routes
router.use(auth);

// Test
router.get('/test-nearest', AmbulancesController.testNearest);

// CRUD
router.post('/', AmbulancesController.addAmbulance);          // Create
router.get('/', AmbulancesController.getAllAmbulances);       // Read All
router.get('/:id', AmbulancesController.getAmbulanceById);    // Read One
router.put('/:id', AmbulancesController.updateAmbulance);     // Update Details
router.delete('/:id', AmbulancesController.deleteAmbulance);  // Delete

// Driver App
router.patch('/:id/location', AmbulancesController.updateLocation);

module.exports = router;