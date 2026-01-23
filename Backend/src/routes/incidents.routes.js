const express = require('express');
const router = express.Router();
const IncidentsController = require('../controllers/incidents.controller');
const auth = require('../middleware/auth');

router.use(auth); 

// NEW: Explicitly add the create route
router.post('/create', IncidentsController.create);

router.get('/', IncidentsController.getAllIncidents);
router.get('/history', IncidentsController.getMyHistory);
router.get('/:id', IncidentsController.getIncidentById);

module.exports = router;