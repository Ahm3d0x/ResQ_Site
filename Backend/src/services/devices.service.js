// File: src/services/devices.service.js
// Description: Manages interactions with the 'devices' table (CRUD operations).

const db = require('../config/db');

class DevicesService {

    /**
     * Create/Register a new device
     */
    static async createDevice(deviceData) {
        const { device_uid, user_id, car_plate, car_model, status } = deviceData;

        const sql = `
            INSERT INTO devices (device_uid, user_id, car_plate, car_model, status)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            device_uid, 
            user_id, 
            car_plate, 
            car_model, 
            status || 'active'
        ]);

        return result.insertId;
    }

    /**
     * Find a device by its Unique Hardware ID (UID)
     * Critical for identifying which car is sending an alert.
     */
    static async findByUid(deviceUid) {
        const sql = `
            SELECT d.*, u.name as owner_name, u.phone as owner_phone, u.lang as owner_lang 
            FROM devices d
            JOIN users u ON d.user_id = u.id
            WHERE d.device_uid = ?
        `;
        const [rows] = await db.query(sql, [deviceUid]);
        return rows[0];
    }

    /**
     * Get all devices (For Admin Dashboard)
     */
    static async findAllDevices() {
        const sql = `
            SELECT d.*, u.name as owner_name, u.email as owner_email 
            FROM devices d
            LEFT JOIN users u ON d.user_id = u.id
            ORDER BY d.created_at DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    }
    
    /**
     * Check if a specific Device UID already exists
     */
    static async checkUidExists(deviceUid) {
        const sql = 'SELECT id FROM devices WHERE device_uid = ?';
        const [rows] = await db.query(sql, [deviceUid]);
        return rows.length > 0;
    }

    // 🔥 NEW: Find by DB ID (For Admin Edit Form)
    static async findById(id) {
        const sql = `
            SELECT d.*, u.name as owner_name 
            FROM devices d
            LEFT JOIN users u ON d.user_id = u.id
            WHERE d.id = ?
        `;
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    }

    // 🔥 NEW: Update Device Details
    static async update(id, data) {
        // Dynamic update query to update only provided fields
        const fields = [];
        const values = [];

        if (data.car_plate) { fields.push('car_plate = ?'); values.push(data.car_plate); }
        if (data.car_model) { fields.push('car_model = ?'); values.push(data.car_model); }
        if (data.status) { fields.push('status = ?'); values.push(data.status); }
        if (data.device_uid) { fields.push('device_uid = ?'); values.push(data.device_uid); }
        if (data.user_id) { fields.push('user_id = ?'); values.push(data.user_id); }

        if (fields.length === 0) return false;

        values.push(id);
        const sql = `UPDATE devices SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    // 🔥 NEW: Delete Device
    static async delete(id) {
        const sql = 'DELETE FROM devices WHERE id = ?';
        await db.query(sql, [id]);
    }
}

module.exports = DevicesService;