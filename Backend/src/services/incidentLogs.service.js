// File: src/services/incidentLogs.service.js
// Description: Records history of actions for each incident.

const db = require('../config/db');

class IncidentLogService {

    /**
     * Log an action related to an incident.
     * @param {Object} data 
     * @param {number} data.incident_id - Target Incident
     * @param {string} data.action - e.g., 'CREATED', 'ASSIGNED_AMBULANCE', 'STATUS_CHANGE'
     * @param {string} data.performed_by - Who did it? ('SYSTEM', 'Admin:1', 'User:5')
     * @param {string} data.note - Optional details
     */
    static async log({ incident_id, action, performed_by = 'SYSTEM', note = null }) {
        try {
            const sql = `
                INSERT INTO incident_logs (incident_id, action, performed_by, note) 
                VALUES (?, ?, ?, ?)
            `;
            await db.query(sql, [incident_id, action, performed_by, note]);
            console.log(`📝 Logged Action [${action}] for Incident #${incident_id}`);
        } catch (error) {
            console.error('Error writing incident log:', error);
            // We don't throw error here to avoid stopping the main process if logging fails
        }
    }

    /**
     * Get logs for a specific incident (To show in Admin Details Page).
     */
    static async getLogsByIncidentId(incidentId) {
        const sql = 'SELECT * FROM incident_logs WHERE incident_id = ? ORDER BY created_at DESC';
        const [rows] = await db.query(sql, [incidentId]);
        return rows;
    }
}

module.exports = IncidentLogService;