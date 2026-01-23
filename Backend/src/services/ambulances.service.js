// File: src/services/ambulances.service.js

const db = require('../config/db');

class AmbulancesService {

    /**
     * Create new ambulance (Independent).
     */
    static async create(data) {
        const { code, ambulance_phone } = data;
        
        // Default location 0,0 until driver connects
        const sql = `
            INSERT INTO ambulances (code, ambulance_phone, status, lat, lng)
            VALUES (?, ?, 'available', 0.0, 0.0)
        `;

        const [result] = await db.query(sql, [code, ambulance_phone]);
        return result.insertId;
    }

    static async findAll() {
        const sql = 'SELECT * FROM ambulances ORDER BY created_at DESC';
        const [rows] = await db.query(sql);
        return rows;
    }

    static async findById(id) {
        const sql = 'SELECT * FROM ambulances WHERE id = ?';
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    }

    /**
     * Update details (Code, Phone).
     */
    static async updateDetails(id, data) {
        const fields = [];
        const values = [];

        if (data.code) { fields.push('code = ?'); values.push(data.code); }
        if (data.ambulance_phone) { fields.push('ambulance_phone = ?'); values.push(data.ambulance_phone); }

        if (fields.length === 0) return false;

        values.push(id);
        const sql = `UPDATE ambulances SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    static async updateLocation(id, lat, lng) {
        const sql = 'UPDATE ambulances SET lat = ?, lng = ?, updated_at = NOW() WHERE id = ?';
        const [result] = await db.query(sql, [lat, lng, id]);
        return result.affectedRows > 0;
    }

    static async updateStatus(id, status) {
        const sql = 'UPDATE ambulances SET status = ? WHERE id = ?';
        const [result] = await db.query(sql, [status, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const sql = 'DELETE FROM ambulances WHERE id = ?';
        await db.query(sql, [id]);
    }

    static async findNearestAvailable(crashLat, crashLng) {
        // Haversine formula
        const sql = `
            SELECT *, 
            ( 6371 * acos( cos( radians(?) ) * cos( radians( lat ) ) 
            * cos( radians( lng ) - radians(?) ) + sin( radians(?) ) 
            * sin( radians( lat ) ) ) ) AS distance 
            FROM ambulances 
            WHERE status = 'available' 
            ORDER BY distance ASC 
            LIMIT 1
        `;
        const [rows] = await db.query(sql, [crashLat, crashLng, crashLat]);
        return rows[0] || null; 
    }
}

module.exports = AmbulancesService;