// File: src/controllers/audit.controller.js
// Description: API to fetch audit logs.

const AuditService = require('../services/audit.service');

class AuditController {

    /**
     * Get list of all admin activities.
     * Access: Admin Only
     */
    static async getLogs(req, res, next) {
        try {
            const logs = await AuditService.findAll();
            
            res.status(200).json({
                status: 'success',
                count: logs.length,
                data: { logs }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuditController;