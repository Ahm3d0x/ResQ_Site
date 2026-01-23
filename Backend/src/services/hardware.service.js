/**
 * src/services/hardware.service.js
 * Description: Manages raw hardware requests logging (Alerts, Cancels, Heartbeats).
 */
const db = require('../config/db');

class HardwareService {

    /**
     * Log a new request (Generic for Alert, Cancel, Heartbeat, Status).
     * @param {Object} data 
     */
    static async createRequest({ device_id, lat, lng, type = 'alert', payload, incident_id = null }) {
        const sql = `
            INSERT INTO hardware_requests 
            (device_id, lat, lng, request_type, raw_payload, incident_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const payloadString = JSON.stringify(payload);

        const [result] = await db.query(sql, [
            device_id, 
            lat || null, 
            lng || null, 
            type, 
            payloadString,
            incident_id
        ]);
        return result.insertId;
    }

    /**
     * Link request to incident (Existing).
     */
    static async updateIncidentId(requestId, incidentId) {
        const sql = 'UPDATE hardware_requests SET incident_id = ? WHERE id = ?';
        await db.query(sql, [incidentId, requestId]);
    }

    /**
     * 🔥 NEW: Update the request type of an existing log.
     * Use case: Converting a specific 'alert' log to 'cancel' if marked as false alarm immediately.
     */
    static async updateRequestType(requestId, newType) {
        const sql = 'UPDATE hardware_requests SET request_type = ? WHERE id = ?';
        await db.query(sql, [newType, requestId]);
    }

    /**
     * 🔥 NEW: Find the original Hardware Request ID associated with an Incident.
     */
    static async findByIncidentId(incidentId) {
        const sql = 'SELECT * FROM hardware_requests WHERE incident_id = ? LIMIT 1';
        const [rows] = await db.query(sql, [incidentId]);
        return rows[0];
    }
}

module.exports = HardwareService;