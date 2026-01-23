// File: src/controllers/ambulances.controller.js
// Description: Handles HTTP requests for Ambulance management with Audit Logging.

const AmbulancesService = require('../services/ambulances.service');
const AuditService = require('../services/audit.service'); // <-- Import Audit Service

class AmbulancesController {

    /**
     * 1. Add a new ambulance.
     * Logs the action to 'audit_admin_changes'.
     */
    static async addAmbulance(req, res, next) {
        try {
            const { code, ambulance_phone } = req.body;

            // Validation
            if (!code || !ambulance_phone) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required fields: code (plate number), ambulance_phone'
                });
            }

            // Create Ambulance
            const ambulanceId = await AmbulancesService.create({
                code,
                ambulance_phone
            });

            // 🔥 LOG AUDIT: CREATE
            // نسجل أن الأدمن قام بإضافة سيارة جديدة
            await AuditService.log({
                adminId: req.user.id, // يأتي من التوكن (Auth Middleware)
                action: 'CREATE',
                targetTable: 'ambulances',
                targetId: ambulanceId,
                note: `Added new ambulance with code: ${code}`
            });

            res.status(201).json({
                status: 'success',
                message: 'Ambulance added successfully',
                data: { ambulanceId }
            });

        } catch (error) { next(error); }
    }

    /**
     * 2. Get all ambulances.
     * (No Audit log needed for reading data usually)
     */
    static async getAllAmbulances(req, res, next) {
        try {
            const ambulances = await AmbulancesService.findAll();
            res.status(200).json({ status: 'success', count: ambulances.length, data: { ambulances } });
        } catch (error) { next(error); }
    }

    /**
     * 3. Get Single Ambulance (For Edit Form).
     */
    static async getAmbulanceById(req, res, next) {
        try {
            const ambulance = await AmbulancesService.findById(req.params.id);
            if (!ambulance) return res.status(404).json({ status: 'error', message: 'Ambulance not found' });
            
            res.status(200).json({ status: 'success', data: { ambulance } });
        } catch (error) { next(error); }
    }

    /**
     * 4. Update Details (Phone, Code).
     * Logs the action to 'audit_admin_changes'.
     */
    static async updateAmbulance(req, res, next) {
        try {
            const { id } = req.params;
            const { code, ambulance_phone } = req.body;

            // Check existence
            const existing = await AmbulancesService.findById(id);
            if (!existing) return res.status(404).json({ status: 'error', message: 'Ambulance not found' });

            // Update
            const updated = await AmbulancesService.updateDetails(id, { code, ambulance_phone });

            if (!updated) return res.status(400).json({ status: 'error', message: 'No changes made' });

            // 🔥 LOG AUDIT: UPDATE
            await AuditService.log({
                adminId: req.user.id,
                action: 'UPDATE',
                targetTable: 'ambulances',
                targetId: id,
                note: `Updated details -> Code: ${code}, Phone: ${ambulance_phone}`
            });

            res.status(200).json({ status: 'success', message: 'Ambulance updated successfully' });
        } catch (error) { next(error); }
    }

    /**
     * 5. Delete Ambulance.
     * Logs the action to 'audit_admin_changes'.
     */
    static async deleteAmbulance(req, res, next) {
        try {
            const { id } = req.params;
            
            const ambulance = await AmbulancesService.findById(id);
            if (!ambulance) return res.status(404).json({ status: 'error', message: 'Ambulance not found' });

            // Safety Check: Prevent deleting active ambulance
            if (ambulance.status !== 'available' && ambulance.status !== 'offline') {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Cannot delete ambulance while it is active/busy.' 
                });
            }

            // Delete
            await AmbulancesService.delete(id);

            // 🔥 LOG AUDIT: DELETE
            await AuditService.log({
                adminId: req.user.id,
                action: 'DELETE',
                targetTable: 'ambulances',
                targetId: id,
                note: `Deleted ambulance record (Code: ${ambulance.code})`
            });

            res.status(200).json({ status: 'success', message: 'Ambulance deleted successfully' });
        } catch (error) { next(error); }
    }

    /**
     * 6. Update Location (Driver App).
     * (Typically we don't audit log high-frequency GPS updates to save DB space)
     */
    static async updateLocation(req, res, next) {
        try {
            const { id } = req.params;
            const { lat, lng } = req.body;

            if (!lat || !lng) return res.status(400).json({ status: 'error', message: 'Coordinates required' });

            await AmbulancesService.updateLocation(id, lat, lng);
            res.status(200).json({ status: 'success', message: 'Location updated' });
        } catch (error) { next(error); }
    }
    
    // Test logic (Optional)
    static async testNearest(req, res, next) {
        try {
            const { lat, lng } = req.query;
            const nearest = await AmbulancesService.findNearestAvailable(lat, lng);
            if (!nearest) return res.status(404).json({ status: 'error', message: 'No ambulance found' });
            res.json({ status: 'success', data: { nearest } });
        } catch (error) { next(error); }
    }
}

module.exports = AmbulancesController;