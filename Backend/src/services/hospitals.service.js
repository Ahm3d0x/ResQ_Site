// File: src/services/hospitals.service.js
// Description: Logic for handling hospital profiles and retrieving assigned cases.

const db = require('../config/db');

class HospitalsService {

    // --- Existing Methods (Keep them) ---

    static async findNearest(lat, lng) {
        const sql = `
            SELECT id, user_id, name, lat, lng, phone, 
            ( 6371 * acos( cos( radians(?) ) * cos( radians( lat ) ) 
            * cos( radians( lng ) - radians(?) ) + sin( radians(?) ) 
            * sin( radians( lat ) ) ) ) AS distance 
            FROM hospitals 
            ORDER BY distance ASC 
            LIMIT 1
        `;
        const [rows] = await db.query(sql, [lat, lng, lat]);
        return rows[0] || null;
    }

    static async getHospitalIdByUserId(userId) {
        const sql = 'SELECT id FROM hospitals WHERE user_id = ?';
        const [rows] = await db.query(sql, [userId]);
        return rows[0] ? rows[0].id : null;
    }

    static async findAll() {
        const sql = `
            SELECT h.*, u.email as user_email 
            FROM hospitals h
            JOIN users u ON h.user_id = u.id
            ORDER BY h.created_at DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    }

/**
     * Get active cases assigned to a specific hospital.
     */
    static async getHospitalCases(hospitalId) {
        const sql = `
            SELECT i.id, i.status, i.created_at, i.g_force, i.latitude, i.longitude,
                   d.car_plate, d.car_model, 
                   a.code as ambulance_code, a.phone as driver_phone
            FROM incidents i
            JOIN devices d ON i.device_id = d.id
            LEFT JOIN ambulances a ON i.assigned_ambulance_id = a.id
            WHERE i.assigned_hospital_id = ? 
            -- 👇 تم التحديث لتشمل الحالات الصحيحة من الداتابيز
            AND i.status IN ('assigned', 'in_progress', 'completed') 
            ORDER BY i.created_at DESC
        `;
        const [rows] = await db.query(sql, [hospitalId]);
        return rows;
    }

    /**
     * Create a new hospital profile linked to a user.
     */
    static async create(data) {
        const { user_id, name, country, governorate, city, street, address_details, lat, lng, phone } = data;
        
        const sql = `
            INSERT INTO hospitals 
            (user_id, name, country, governorate, city, street, address_details, lat, lng, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(sql, [
            user_id, name, country, governorate, city, street, address_details, lat, lng, phone
        ]);
        return result.insertId;
    }

    /**
     * Find hospital details by its ID (for Edit Page).
     */
    static async findById(id) {
        const sql = `
            SELECT h.*, u.email, u.name as owner_name 
            FROM hospitals h
            JOIN users u ON h.user_id = u.id
            WHERE h.id = ?
        `;
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    }

    /**
     * Update hospital details.
     */
    static async update(id, data) {
        const fields = [];
        const values = [];

        // Add fields dynamically if they exist in data
        const allowedFields = ['name', 'country', 'governorate', 'city', 'street', 'address_details', 'lat', 'lng', 'phone'];
        
        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });

        if (fields.length === 0) return false;

        values.push(id);
        const sql = `UPDATE hospitals SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    /**
     * Delete hospital profile.
     */
    static async delete(id) {
        const sql = 'DELETE FROM hospitals WHERE id = ?';
        await db.query(sql, [id]);
    }
}

module.exports = HospitalsService;