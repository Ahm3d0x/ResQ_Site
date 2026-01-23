// File: src/controllers/incidents.controller.js
// Description: Handles HTTP requests for Incident History & Management.

const IncidentsService = require('../services/incidents.service');
const HardwareService = require('../services/hardware.service');
const DevicesService = require('../services/devices.service');
class IncidentsController {
static async create(req, res, next) {
        try {
            const { device_uid, latitude, longitude, g_force } = req.body;

            // 1. Validate Device
            const device = await DevicesService.findByUid(device_uid);
            if (!device) {
                return res.status(404).json({ status: 'error', message: 'Device not found' });
            }

            // 2. Log the raw Hardware Request FIRST 📝
            // This fixes the issue where hardware_requests was being skipped
            const hwRequestId = await HardwareService.createRequest({
                device_id: device.id,
                lat: latitude,
                lng: longitude,
                type: 'alert',
                payload: req.body // Store full raw data
            });

            // 3. Create the Incident and link it to the Hardware Request ID
            const incidentId = await IncidentsService.createIncident({
                device_id: device.id,
                user_id: device.user_id,
                hardware_request_id: hwRequestId, // 👈 Link established here
                latitude,
                longitude,
                g_force: g_force || 0
            });

            // 4. Update the Hardware Request with the generated Incident ID
            await HardwareService.updateIncidentId(hwRequestId, incidentId);

            res.status(201).json({
                status: 'success',
                message: 'Incident and Hardware Request logged successfully',
                data: { incidentId, hardwareRequestId: hwRequestId }
            });

        } catch (error) {
            next(error);
        }
    }
    /**
     * Get All Incidents.
     * Access: Admin Only
     * Use Case: Admin Dashboard -> Incidents Table
     */
    static async getAllIncidents(req, res, next) {
        try {
            const incidents = await IncidentsService.findAll();
            res.status(200).json({
                status: 'success',
                count: incidents.length,
                data: { incidents }
            });
        } catch (error) { next(error); }
    }

    /**
     * Get User's Incident History.
     * Access: Authenticated User
     * Use Case: Mobile App -> My History
     */
    static async getMyHistory(req, res, next) {
        try {
            const userId = req.user.id; // From Token
            const incidents = await IncidentsService.findByUserId(userId);
            
            res.status(200).json({
                status: 'success',
                count: incidents.length,
                data: { incidents }
            });
        } catch (error) { next(error); }
    }

    /**
     * Get Single Incident Details.
     * Access: Admin or The Owner User
     */
    static async getIncidentById(req, res, next) {
        try {
            const { id } = req.params;
            const incident = await IncidentsService.getIncidentById(id);

            if (!incident) {
                return res.status(404).json({ status: 'error', message: 'Incident not found' });
            }

            // Security Check: Only Admin or Owner can view
            if (req.user.role !== 'admin' && req.user.id !== incident.user_id) {
                return res.status(403).json({ status: 'error', message: 'Access denied' });
            }

            res.status(200).json({
                status: 'success',
                data: { incident }
            });
        } catch (error) { next(error); }
    }
    static async updateMedicalStatus(req, res, next) {
        try {
            const { incidentId } = req.params;
            const { status } = req.body; // treatment, stable, critical, discharged, deceased

            const validStatuses = ['unknown', 'treatment', 'critical', 'stable', 'discharged', 'deceased'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ status: 'error', message: 'Invalid medical status' });
            }

            await IncidentsService.updatePatientStatus(incidentId, status);

            res.status(200).json({ 
                status: 'success', 
                message: `Patient status updated to ${status}` 
            });

        } catch (error) { next(error); }
    }
}

module.exports = IncidentsController;