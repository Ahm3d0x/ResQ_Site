// File: src/controllers/hospitals.controller.js
// Description: Handles Hospital Dashboard requests & Admin Management.

const HospitalsService = require('../services/hospitals.service');
const UsersService = require('../services/users.service');
const AuditService = require('../services/audit.service'); 
const IncidentsService = require('../services/incidents.service');

class HospitalsController {

    // --- Hospital Dashboard Methods (Existing) ---

    static async getMyCases(req, res, next) {
        try {
            const userId = req.user.id; 
            const hospitalId = await HospitalsService.getHospitalIdByUserId(userId);
            
            if (!hospitalId) {
                return res.status(404).json({ status: 'error', message: 'No hospital profile found.' });
            }

            const cases = await HospitalsService.getHospitalCases(hospitalId);
            res.status(200).json({ status: 'success', count: cases.length, data: { cases } });
        } catch (error) { next(error); }
    }

    // --- Admin Methods (Refined & Expanded) ---

    /**
     * Get list of all hospitals (For Admin Dashboard).
     */
    static async getAllHospitals(req, res, next) {
        try {
            const hospitals = await HospitalsService.findAll();
            res.status(200).json({ status: 'success', count: hospitals.length, data: { hospitals } });
        } catch (error) { next(error); }
    }

    /**
     * Get Single Hospital by ID (For Edit Page).
     */
    static async getHospitalById(req, res, next) {
        try {
            const hospital = await HospitalsService.findById(req.params.id);
            if (!hospital) return res.status(404).json({ status: 'error', message: 'Hospital not found' });
            res.status(200).json({ status: 'success', data: { hospital } });
        } catch (error) { next(error); }
    }

    /**
     * Add New Hospital (Admin).
     * Requires an existing User ID (Role: Hospital).
     */
    static async addHospital(req, res, next) {
        try {
            const { user_id, name, city, lat, lng, phone, country, governorate, street, address_details } = req.body;

            // 1. Validation
            if (!user_id || !name || !city || !lat || !lng) {
                return res.status(400).json({ status: 'error', message: 'Missing required fields' });
            }

            // 2. Verify User Exists
            const user = await UsersService.findById(user_id);
            if (!user) return res.status(404).json({ status: 'error', message: 'User ID not found' });
            if (user.role !== 'hospital') return res.status(400).json({ status: 'error', message: 'User must have "hospital" role' });

            // 3. Check duplicate (One profile per user)
            const existingId = await HospitalsService.getHospitalIdByUserId(user_id);
            if (existingId) return res.status(409).json({ status: 'error', message: 'This user already has a hospital profile' });

            // 4. Create
            const hospitalId = await HospitalsService.create({
                user_id, name, city, lat, lng, phone, country, governorate, street, address_details
            });

            // 🔥 Audit
            await AuditService.log({
                adminId: req.user.id,
                action: 'CREATE',
                targetTable: 'hospitals',
                targetId: hospitalId,
                note: `Added hospital: ${name}`
            });

            res.status(201).json({ status: 'success', message: 'Hospital added successfully', data: { hospitalId } });

        } catch (error) { next(error); }
    }

    /**
     * Update Hospital (Admin).
     */
    static async updateHospital(req, res, next) {
        try {
            const { id } = req.params;
            const existing = await HospitalsService.findById(id);
            if (!existing) return res.status(404).json({ status: 'error', message: 'Hospital not found' });

            await HospitalsService.update(id, req.body);

            // 🔥 Audit
            await AuditService.log({
                adminId: req.user.id,
                action: 'UPDATE',
                targetTable: 'hospitals',
                targetId: id,
                note: `Updated hospital details: ${existing.name}`
            });

            res.status(200).json({ status: 'success', message: 'Hospital updated successfully' });

        } catch (error) { next(error); }
    }

    /**
     * Delete Hospital (Admin).
     */
    static async deleteHospital(req, res, next) {
        try {
            const { id } = req.params;
            const existing = await HospitalsService.findById(id);
            if (!existing) return res.status(404).json({ status: 'error', message: 'Hospital not found' });

            await HospitalsService.delete(id);

            // 🔥 Audit
            await AuditService.log({
                adminId: req.user.id,
                action: 'DELETE',
                targetTable: 'hospitals',
                targetId: id,
                note: `Deleted hospital: ${existing.name}`
            });

            res.status(200).json({ status: 'success', message: 'Hospital deleted successfully' });

        } catch (error) { next(error); }
    }
    static async updateMedicalStatus(req, res, next) {
        try {
            const { incidentId } = req.params;
            const { status } = req.body; // treatment, stable, critical, discharged, deceased

            // Validate status enum
            const validStatuses = ['unknown', 'treatment', 'critical', 'stable', 'discharged', 'deceased'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ status: 'error', message: 'Invalid medical status' });
            }

            // Call Service
            await IncidentsService.updatePatientStatus(incidentId, status);

            res.status(200).json({ 
                status: 'success', 
                message: `Patient status updated to ${status}` 
            });

        } catch (error) { next(error); }
    }
}

module.exports = HospitalsController;