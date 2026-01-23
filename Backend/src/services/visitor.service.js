// File: src/services/visitor.service.js
const db = require('../config/db');

class VisitorService {

    /**
     * 🔥 NEW: Find latest active incident by USER ID directly.
     * This checks if the user (e.g. User #5) has any active accidents on ANY of their cars.
     */
    static async findLatestIncidentByUserId(userId) {
        const sql = `
            SELECT 
                i.id as incident_id, 
                i.status, 
                i.updated_at, 
                i.latitude, 
                i.longitude,
                d.device_uid,  -- We fetch this to log it later if found
                d.car_model,   -- Extra info for the visitor
                h.name as hospital_name
            FROM incidents i
            JOIN devices d ON i.device_id = d.id
            LEFT JOIN hospitals h ON i.assigned_hospital_id = h.id
            WHERE i.user_id = ? 
            ORDER BY i.created_at DESC 
            LIMIT 1
        `;
        const [rows] = await db.query(sql, [userId]);
        return rows[0] || null;
    }

    /**
     * Log the search action.
     * Modified to handle searches by User ID.
     */
    static async logSearch(data) {
        const { visitor_name, visitor_email, device_uid_searched, search_query_raw, incident_id } = data;

        const sql = `
            INSERT INTO visitor_searches 
            (visitor_name, visitor_email, device_uid_searched, search_query_raw, incident_id, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        await db.query(sql, [
            visitor_name, 
            visitor_email, 
            // If we found a device_uid from the incident, use it. Otherwise, use a placeholder to satisfy DB constraint.
            device_uid_searched || `User_Search_${search_query_raw}`, 
            search_query_raw, // Store the User ID here
            incident_id || null
        ]);
    }

    static async getSearchHistoryForUser(userId) {
        // ... (نفس الكود القديم - لا تغيير هنا)
        const sql = `
            SELECT vs.*, d.car_plate 
            FROM visitor_searches vs
            LEFT JOIN devices d ON vs.device_uid_searched = d.device_uid
            -- We filter by devices owned by this user
            WHERE d.user_id = ?
            ORDER BY vs.created_at DESC
        `;
        const [rows] = await db.query(sql, [userId]);
        return rows;
    }
}

module.exports = VisitorService;