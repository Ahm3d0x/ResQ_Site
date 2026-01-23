// File: src/controllers/devices.controller.js
// Description: Handles HTTP requests related to hardware devices with Audit Logging.

const DevicesService = require('../services/devices.service');
const UsersService = require('../services/users.service');
const AuditService = require('../services/audit.service'); 

class DevicesController {

    /**
     * 1. Add Device (With Audit)
     */
    static async addDevice(req, res, next) {
        try {
            const { device_uid, user_id, car_plate, car_model, status } = req.body;

            if (!device_uid || !user_id || !car_plate) {
                return res.status(400).json({ status: 'error', message: 'Missing required fields' });
            }

            const userExists = await UsersService.findById(user_id);
            if (!userExists) return res.status(404).json({ status: 'error', message: 'User not found' });

            const isDuplicate = await DevicesService.checkUidExists(device_uid);
            if (isDuplicate) return res.status(409).json({ status: 'error', message: 'Device UID already exists' });

            const deviceId = await DevicesService.createDevice({
                device_uid, user_id, car_plate, car_model, status
            });

            await AuditService.log({
                adminId: req.user.id,
                action: 'CREATE',
                targetTable: 'devices',
                targetId: deviceId,
                note: `Registered device ${device_uid} for User #${user_id}`
            });

            res.status(201).json({ 
                status: 'success', 
                message: 'Device added successfully', 
                data: { deviceId, device_uid } 
            });

        } catch (error) { next(error); }
    }

    /**
     * 2. Get All Devices
     */
    static async getAllDevices(req, res, next) {
        try {
            const devices = await DevicesService.findAllDevices();
            res.status(200).json({ status: 'success', count: devices.length, data: { devices } });
        } catch (error) { next(error); }
    }

    /**
     * 3. Get One by UID (For Hardware check)
     */
    static async getDeviceByUid(req, res, next) {
        try {
            const device = await DevicesService.findByUid(req.params.uid);
            if (!device) return res.status(404).json({ status: 'error', message: 'Device not found' });
            res.status(200).json({ status: 'success', data: { device } });
        } catch (error) { next(error); }
    }

    /**
     * 4. Get One by ID (For Admin Edit Page) - هذه الدالة غالباً هي الناقصة
     */
    static async getDeviceById(req, res, next) {
        try {
            const device = await DevicesService.findById(req.params.id);
            if (!device) return res.status(404).json({ status: 'error', message: 'Device not found' });
            res.status(200).json({ status: 'success', data: { device } });
        } catch (error) { next(error); }
    }

    /**
     * 5. Update Device (With Audit) - وهذه أيضاً
     */
    static async updateDevice(req, res, next) {
        try {
            const { id } = req.params;
            const { car_plate, car_model, status, device_uid, user_id } = req.body;

            const existing = await DevicesService.findById(id);
            if (!existing) return res.status(404).json({ status: 'error', message: 'Device not found' });

            const updated = await DevicesService.update(id, { car_plate, car_model, status, device_uid, user_id });

            if (!updated) return res.status(400).json({ status: 'error', message: 'No changes made' });

            await AuditService.log({
                adminId: req.user.id,
                action: 'UPDATE',
                targetTable: 'devices',
                targetId: id,
                note: `Updated device details (UID: ${device_uid || existing.device_uid})`
            });

            res.status(200).json({ status: 'success', message: 'Device updated successfully' });
        } catch (error) { next(error); }
    }

    /**
     * 6. Delete Device (With Audit) - وهذه أيضاً
     */
    static async deleteDevice(req, res, next) {
        try {
            const { id } = req.params;
            
            const existing = await DevicesService.findById(id);
            if (!existing) return res.status(404).json({ status: 'error', message: 'Device not found' });

            await DevicesService.delete(id);

            await AuditService.log({
                adminId: req.user.id,
                action: 'DELETE',
                targetTable: 'devices',
                targetId: id,
                note: `Deleted device with UID: ${existing.device_uid}`
            });

            res.status(200).json({ status: 'success', message: 'Device deleted successfully' });
        } catch (error) { next(error); }
    }
}

module.exports = DevicesController;