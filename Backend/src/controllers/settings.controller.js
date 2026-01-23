// File: src/controllers/settings.controller.js
// Description: API handlers for System Settings. Admin Access Only.

const SettingsService = require('../services/settings.service');
// const AuditService = require('../services/audit.service'); // Uncomment if Audit is ready

class SettingsController {

    /**
     * Get all system settings.
     */
    static async getAllSettings(req, res, next) {
        try {
            // Security Check: Only Admin can view system configs
            if (req.user.role !== 'admin') {
                return res.status(403).json({ status: 'error', message: 'Access denied. Admins only.' });
            }

            const settings = await SettingsService.findAll();
            
            // Convert array to object for easier frontend consumption { key: value }
            // Or keep as array if you want to show descriptions in a table
            res.status(200).json({ 
                status: 'success', 
                data: { settings } 
            });

        } catch (error) { next(error); }
    }

    /**
     * Update a specific setting.
     */
    static async updateSetting(req, res, next) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ status: 'error', message: 'Access denied. Admins only.' });
            }

            const { key } = req.params;
            const { value } = req.body;

            if (value === undefined) {
                return res.status(400).json({ status: 'error', message: 'Value is required' });
            }

            const updated = await SettingsService.update(key, value);

            if (!updated) {
                return res.status(404).json({ status: 'error', message: 'Setting key not found' });
            }

            // Optional: Log this action
            /* await AuditService.log({
                adminId: req.user.id,
                action: 'UPDATE_SETTING',
                target: key,
                note: `Changed value to ${value}`
            });
            */

            res.status(200).json({ 
                status: 'success', 
                message: 'Setting updated successfully' 
            });

        } catch (error) { next(error); }
    }
}

module.exports = SettingsController;