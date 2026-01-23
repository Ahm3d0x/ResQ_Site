// File: src/services/settings.service.js
// Description: Manages global system configurations (e.g., Confirmation Timer, Search Radius).

const db = require('../config/db');

class SettingsService {

    /**
     * Get all settings as a list.
     */
    static async findAll() {
        const sql = 'SELECT `key`, `value`, `description`, `updated_at` FROM settings';
        const [rows] = await db.query(sql);
        return rows;
    }

    /**
     * Get a single setting value by key.
     * Useful for internal system use (e.g., getting timer duration inside SocketManager).
     * @param {string} key 
     * @param {any} defaultValue - Fallback if key not found
     */
    static async getByKey(key, defaultValue = null) {
        const sql = 'SELECT `value` FROM settings WHERE `key` = ?';
        const [rows] = await db.query(sql, [key]);
        return rows.length > 0 ? rows[0].value : defaultValue;
    }

    /**
     * Update a specific setting.
     */
    static async update(key, value) {
        const sql = 'UPDATE settings SET `value` = ?, updated_at = NOW() WHERE `key` = ?';
        const [result] = await db.query(sql, [value, key]);
        return result.affectedRows > 0;
    }

    /**
     * Seed default settings if they don't exist (Optional helper).
     * Ensures critical keys always exist.
     */
    static async initDefaults() {
        const defaults = [
            { key: 'confirmation_timeout', value: '10', desc: 'Seconds to wait before confirming accident' },
            { key: 'search_radius', value: '50', desc: 'Search radius for ambulances in KM' },
            { key: 'system_mode', value: 'auto', desc: 'Dispatch mode: auto or manual' }
        ];

        for (const setting of defaults) {
            const sql = `
                INSERT INTO settings (\`key\`, \`value\`, description) 
                SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM settings WHERE \`key\` = ?)
            `;
            await db.query(sql, [setting.key, setting.value, setting.desc, setting.key]);
        }
    }
}

module.exports = SettingsService;