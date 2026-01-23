// File: src/services/audit.service.js
// Description: Centralized logging for Admin actions.

const db = require('../config/db');

class AuditService {

    /**
     * Log an admin action.
     * @param {Object} data
     * @param {number} data.adminId - The ID of the admin performing the action.
     * @param {string} data.action - E.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'.
     * @param {string} data.targetTable - E.g., 'ambulances', 'hospitals'.
     * @param {number} data.targetId - The ID of the affected record.
     * @param {string} [data.note] - Optional details (e.g., "Changed status to busy").
     */
    static async log(data) {
        const { adminId, action, targetTable, targetId, note } = data;

        const sql = `
            INSERT INTO audit_admin_changes 
            (admin_user_id, action, target_table, target_id, note)
            VALUES (?, ?, ?, ?, ?)
        `;

        try {
            await db.query(sql, [adminId, action, targetTable, targetId, note || null]);
            console.log(`📝 Audit Log: Admin #${adminId} performed ${action} on ${targetTable} #${targetId}`);
        } catch (error) {
            console.error('❌ Failed to write audit log:', error.message);
            // We don't throw error here to prevent blocking the main operation
        }
    }

    /**
     * Get all audit logs (for Admin Dashboard).
     * Joins with users table to show Admin Name.
     */
    static async findAll() {
        const sql = `
            SELECT a.*, u.name as admin_name, u.email as admin_email
            FROM audit_admin_changes a
            LEFT JOIN users u ON a.admin_user_id = u.id
            ORDER BY a.created_at DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    }
}

module.exports = AuditService;