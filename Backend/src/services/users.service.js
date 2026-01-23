// File: src/services/users.service.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

class UsersService {

    // --- Existing Methods (Keep them) ---
    static async createUser(userData) {
        const { name, email, password, phone, role, lang } = userData;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const sql = `INSERT INTO users (name, email, password_hash, phone, role, lang, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`;
        const [result] = await db.query(sql, [name, email, passwordHash, phone, role || 'user', lang || 'en']);
        return result.insertId;
    }

    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await db.query(sql, [email]);
        return rows[0];
    }

    static async findById(id) {
        const sql = 'SELECT id, name, email, phone, role, lang, is_active, created_at FROM users WHERE id = ?';
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    }

    // --- 🔥 NEW METHODS (Required for Full CRUD) ---

    /**
     * Get All Users (For Admin Dashboard)
     */
    static async findAll() {
        // Retrieve all users excluding passwords
        const sql = 'SELECT id, name, email, phone, role, lang, is_active, created_at FROM users ORDER BY created_at DESC';
        const [rows] = await db.query(sql);
        return rows;
    }

    /**
     * Update User Data (Dynamic Update)
     * Can update name, phone, role, lang, is_active
     */
    static async update(id, data) {
        const fields = [];
        const values = [];

        // Add fields dynamically if they exist in data
        if (data.name) { fields.push('name = ?'); values.push(data.name); }
        if (data.phone) { fields.push('phone = ?'); values.push(data.phone); }
        if (data.lang) { fields.push('lang = ?'); values.push(data.lang); }
        
        // Only Admin should send 'role' or 'is_active', controlled by controller
        if (data.role) { fields.push('role = ?'); values.push(data.role); }
        if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

        if (fields.length === 0) return false; // Nothing to update

        values.push(id);
        const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    /**
     * Update Password Only
     */
    static async updatePassword(id, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        
        const sql = 'UPDATE users SET password_hash = ? WHERE id = ?';
        const [result] = await db.query(sql, [hash, id]);
        return result.affectedRows > 0;
    }
/**
     * Update the current incident ID for a user.
     * @param {number} userId 
     * @param {number|null} incidentId - Pass ID to lock user, or NULL to free them.
     */
    static async updateCurrentIncident(userId, incidentId) {
        const sql = 'UPDATE users SET current_incident_id = ? WHERE id = ?';
        const [result] = await db.query(sql, [incidentId, userId]);
        return result.affectedRows > 0;
    }
    /**
     * Delete User (Hard Delete)
     */
    static async delete(id) {
        const sql = 'DELETE FROM users WHERE id = ?';
        const [result] = await db.query(sql, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = UsersService;