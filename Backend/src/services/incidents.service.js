// File: src/services/incidents.service.js
// Description: Manages Incident data (Creation, Status Updates, Retrieval, History Logging, and Patient Status).

const db = require('../config/db');
const IncidentLogService = require('./incidentLogs.service');
const UsersService = require('./users.service');

class IncidentsService {

    /**
     * Create a new incident linked to User and Hardware Request.
     */
static async createIncident(data) {
    const { device_id, user_id, hardware_request_id, latitude, longitude, g_force } = data;

    const deadline = new Date(Date.now() + 10000); 

    const sql = `
        INSERT INTO incidents 
        (device_id, user_id, hardware_request_id, latitude, longitude, g_force, status, is_false_alarm, mode, confirmation_deadline) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, 'auto', ?)
    `;

    const [result] = await db.query(sql, [
        device_id, 
        user_id,             
        hardware_request_id, 
        latitude, 
        longitude, 
        g_force || 0,
        deadline
    ]);
    
    const incidentId = result.insertId;

    // 1. Update User's Current Incident [cite: 140, 150]
    if (user_id) {
        await UsersService.updateCurrentIncident(user_id, incidentId);
    }

    // 2. Log Creation in History [cite: 247, 253]
    await IncidentLogService.log({
        incident_id: incidentId,
        action: 'CREATED',
        performed_by: 'HARDWARE',
        note: `Crash detected with G-Force: ${g_force}`
    });

    return incidentId;
}
/**
 * Update the medical status of the patient and handle user state accordingly.
 * @param {number} incidentId 
 * @param {string} status - treatment, critical, stable, discharged, deceased
 */
static async updatePatientStatus(incidentId, status) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update patient medical status in incidents table [cite: 220, 243]
        await connection.query(
            'UPDATE incidents SET patient_status = ? WHERE id = ?', 
            [status, incidentId]
        );

        // 2. LOGIC CHANGE: ONLY 'discharged' clears the user incident lock 
        // In case of 'deceased', we keep current_incident_id to preserve the record.
        if (status === 'discharged') {
            const [rows] = await connection.query('SELECT user_id FROM incidents WHERE id = ?', [incidentId]);
            
            if (rows.length > 0) {
                const userId = rows[0].user_id;
                // Clear the incident ID for the user only if they are safe/discharged 
                await connection.query('UPDATE users SET current_incident_id = NULL WHERE id = ?', [userId]);
            }
        }

        // 3. Close the incident record for both end-of-process statuses [cite: 234, 243]
        if (status === 'discharged' || status === 'deceased') {
            await connection.query(
                "UPDATE incidents SET status = 'completed', resolved_at = NOW() WHERE id = ?", 
                [incidentId]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
    /**
     * Get ALL Incidents (For Admin Dashboard Table)
     */
    static async findAll() {
        const sql = `
            SELECT 
                i.*, 
                d.car_plate, d.car_model,
                u.name as owner_name, u.phone as owner_phone,
                a.code as ambulance_code,
                h.name as hospital_name
            FROM incidents i
            LEFT JOIN devices d ON i.device_id = d.id
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN ambulances a ON i.assigned_ambulance_id = a.id
            LEFT JOIN hospitals h ON i.assigned_hospital_id = h.id
            ORDER BY i.created_at DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    }

    /**
     * Get Incidents for specific User (For User App History)
     */
    static async findByUserId(userId) {
        const sql = `
            SELECT id, status, created_at, latitude, longitude, assigned_hospital_id 
            FROM incidents 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;
        const [rows] = await db.query(sql, [userId]);
        return rows;
    }

    /**
     * Get incident details including Car and Owner info.
     * Used for the Dashboard View.
     */
    static async getIncidentById(id) {
        // Correct column name: a.ambulance_phone
        const sql = `
            SELECT 
                i.*, 
                d.device_uid, d.car_plate, d.car_model,
                u.name as owner_name, u.phone as owner_phone, u.lang as owner_lang,
                a.code as ambulance_code, a.ambulance_phone, 
                h.name as hospital_name, h.lat as hospital_lat, h.lng as hospital_lng
            FROM incidents i
            LEFT JOIN devices d ON i.device_id = d.id
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN ambulances a ON i.assigned_ambulance_id = a.id
            LEFT JOIN hospitals h ON i.assigned_hospital_id = h.id
            WHERE i.id = ?
        `;
        
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    }

    /**
     * Update incident status (e.g., 'pending' -> 'dispatched' -> 'resolved').
     */
    static async updateStatus(id, newStatus) {
        const sql = 'UPDATE incidents SET status = ? WHERE id = ?';
        const [result] = await db.query(sql, [newStatus, id]);

        if (result.affectedRows > 0) {
            // Log Status Change
            await IncidentLogService.log({
                incident_id: id,
                action: 'STATUS_CHANGE',
                performed_by: 'SYSTEM',
                note: `Status updated to ${newStatus}`
            });
        }
        return result.affectedRows > 0;
    }

    /**
     * Mark incident as False Alarm.
     */
    static async markAsFalseAlarm(id) {
        const sql = 'UPDATE incidents SET is_false_alarm = 1, status = \'resolved\' WHERE id = ?';        
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows > 0) {
            // Log False Alarm
            await IncidentLogService.log({
                incident_id: id,
                action: 'CANCELLED',
                performed_by: 'USER/TIMER',
                note: 'Marked as False Alarm'
            });
        }
        return result.affectedRows > 0;
    }

    /**
     * Assign an ambulance to an incident.
     */
    static async assignAmbulance(incidentId, ambulanceId) {
        const sql = `
            UPDATE incidents 
            SET assigned_ambulance_id = ?, status = 'dispatched', updated_at = NOW() 
            WHERE id = ?
        `;
        const [result] = await db.query(sql, [ambulanceId, incidentId]);
        
        if (result.affectedRows > 0) {
            // Log Ambulance Assignment
            await IncidentLogService.log({
                incident_id: incidentId,
                action: 'ASSIGNED_AMBULANCE',
                performed_by: 'SYSTEM',
                note: `Ambulance #${ambulanceId} assigned`
            });
        }
        return result.affectedRows > 0;
    }

    /**
     * Assign a hospital to an incident.
     */
    static async assignHospital(incidentId, hospitalId) {
        const sql = 'UPDATE incidents SET assigned_hospital_id = ? WHERE id = ?';
        const [result] = await db.query(sql, [hospitalId, incidentId]);

        if (result.affectedRows > 0) {
            // Log Hospital Assignment
            await IncidentLogService.log({
                incident_id: incidentId,
                action: 'ASSIGNED_HOSPITAL',
                performed_by: 'SYSTEM',
                note: `Hospital #${hospitalId} assigned`
            });
        }
        return result.affectedRows > 0;
    }

    /**
     * Complete the mission.
     */
    static async completeMission(incidentId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query('SELECT assigned_ambulance_id FROM incidents WHERE id = ?', [incidentId]);
            if (rows.length === 0) throw new Error('Incident not found');
            
            const ambulanceId = rows[0].assigned_ambulance_id;

            await connection.query("UPDATE incidents SET status = 'completed', resolved_at = NOW() WHERE id = ?", [incidentId]);

            if (ambulanceId) {
                await connection.query("UPDATE ambulances SET status = 'available' WHERE id = ?", [ambulanceId]);
            }

            await connection.commit();

            // Log Completion
            await IncidentLogService.log({
                incident_id: incidentId,
                action: 'COMPLETED',
                performed_by: 'DRIVER', 
                note: 'Mission completed and ambulance freed'
            });

            return { success: true, ambulanceId };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = IncidentsService;