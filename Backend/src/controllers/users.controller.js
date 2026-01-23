// File: src/controllers/users.controller.js
// Description: Handles User operations including Admin overrides and Audit logging.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsersService = require('../services/users.service');
const AuditService = require('../services/audit.service'); // 👈 تأكد من وجود هذا الملف

class UsersController {

    // --- Basic Auth Methods ---

    static async register(req, res, next) {
        try {
            const { name, email, password, phone, role, lang } = req.body;

            if (!name || !email || !password || !phone) {
                return res.status(400).json({ status: 'error', message: 'Missing fields' });
            }

            const existingUser = await UsersService.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ status: 'error', message: 'Email already registered' });
            }

            const userId = await UsersService.createUser({ name, email, password, phone, role, lang });

            res.status(201).json({ status: 'success', message: 'User registered', data: { userId } });
        } catch (error) { next(error); }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ status: 'error', message: 'Missing credentials' });

            const user = await UsersService.findByEmail(email);
            if (!user) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });

            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
            });
        } catch (error) { next(error); }
    }

    static async getProfile(req, res, next) {
        try {
            const user = await UsersService.findById(req.user.id);
            if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
            res.status(200).json({ status: 'success', data: { user } });
        } catch (error) { next(error); }
    }

    // --- 🔥 NEW METHODS (كانت ناقصة وتسبب الخطأ) ---

    // 1. Change Password (User Self Service)
    static async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ status: 'error', message: 'Password too short' });
            }

            // Verify old password
            const userWithHash = await UsersService.findByEmail((await UsersService.findById(userId)).email);
            const isMatch = await bcrypt.compare(currentPassword, userWithHash.password_hash);
            
            if (!isMatch) {
                return res.status(401).json({ status: 'error', message: 'Incorrect current password' });
            }

            await UsersService.updatePassword(userId, newPassword);
            res.status(200).json({ status: 'success', message: 'Password changed successfully' });

        } catch (error) { next(error); }
    }

    // 2. Get All Users (Admin)
    static async getAllUsers(req, res, next) {
        try {
            if (req.user.role !== 'admin') return res.status(403).json({ status: 'error', message: 'Admins only' });
            
            const users = await UsersService.findAll();
            res.status(200).json({ status: 'success', count: users.length, data: { users } });
        } catch (error) { next(error); }
    }

    // 3. Get User By ID (Admin)
    static async getUserById(req, res, next) {
        try {
            if (req.user.role !== 'admin') return res.status(403).json({ status: 'error', message: 'Admins only' });

            const user = await UsersService.findById(req.params.id);
            if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

            res.status(200).json({ status: 'success', data: { user } });
        } catch (error) { next(error); }
    }

    // 4. Update User (Admin or Self) + Audit
    static async updateUser(req, res, next) {
        try {
            const targetId = parseInt(req.params.id);
            const requester = req.user;

            if (requester.role !== 'admin' && requester.id !== targetId) {
                return res.status(403).json({ status: 'error', message: 'Access denied' });
            }

            const updates = { ...req.body };
            if (requester.role !== 'admin') {
                delete updates.role;
                delete updates.is_active;
            }

            const success = await UsersService.update(targetId, updates);
            if (!success) return res.status(400).json({ status: 'error', message: 'Update failed' });

            // Audit Log if Admin
            if (requester.role === 'admin' && requester.id !== targetId) {
                await AuditService.log({
                    adminId: requester.id,
                    action: 'UPDATE',
                    targetTable: 'users',
                    targetId: targetId,
                    note: `Updated user info: ${JSON.stringify(updates)}`
                });
            }

            res.status(200).json({ status: 'success', message: 'User updated successfully' });
        } catch (error) { next(error); }
    }

    // 5. Force Reset Password (Admin) + Audit
    static async resetUserPassword(req, res, next) {
        try {
            if (req.user.role !== 'admin') return res.status(403).json({ status: 'error', message: 'Admins only' });

            const targetId = req.params.id;
            const { newPassword } = req.body;

            if (!newPassword || newPassword.length < 6) return res.status(400).json({ status: 'error', message: 'Password too short' });

            const success = await UsersService.updatePassword(targetId, newPassword);
            if (!success) return res.status(404).json({ status: 'error', message: 'User not found' });

            await AuditService.log({
                adminId: req.user.id,
                action: 'UPDATE_PASSWORD',
                targetTable: 'users',
                targetId: targetId,
                note: 'Admin forced password reset'
            });

            res.status(200).json({ status: 'success', message: 'Password reset successfully' });
        } catch (error) { next(error); }
    }

    // 6. Delete User (Admin) + Audit
    static async deleteUser(req, res, next) {
        try {
            if (req.user.role !== 'admin') return res.status(403).json({ status: 'error', message: 'Admins only' });

            const targetId = req.params.id;
            const existingUser = await UsersService.findById(targetId);
            
            if (!existingUser) return res.status(404).json({ status: 'error', message: 'User not found' });

            await UsersService.delete(targetId);

            await AuditService.log({
                adminId: req.user.id,
                action: 'DELETE',
                targetTable: 'users',
                targetId: targetId,
                note: `Deleted user: ${existingUser.name}`
            });

            res.status(200).json({ status: 'success', message: 'User deleted successfully' });
        } catch (error) { next(error); }
    }
}

module.exports = UsersController;