// File: src/routes/hospitals.routes.js
// Description: API Routes for Hospital Management

const express = require('express');
const router = express.Router();
const HospitalsController = require('../controllers/hospitals.controller');
const auth = require('../middleware/auth');

router.use(auth); // Token Guard 🛡️

// --- 🏥 Hospital Dashboard Routes ---
// Special route for the logged-in hospital to see its cases
router.get('/cases', HospitalsController.getMyCases);

// --- 👮‍♂️ Admin Management Routes ---
// Create
router.post('/', HospitalsController.addHospital);

// Read All
router.get('/', HospitalsController.getAllHospitals);

// Read One
router.get('/:id', HospitalsController.getHospitalById);

// Update
router.put('/:id', HospitalsController.updateHospital);

// Delete
router.delete('/:id', HospitalsController.deleteHospital);
router.put('/cases/:incidentId/status', HospitalsController.updateMedicalStatus);

module.exports = router;