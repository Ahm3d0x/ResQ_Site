// File: src/controllers/hardware.controller.js
// Description: API Endpoints for Hardware to send Heartbeats/Status/Events via HTTP.

const HardwareService = require('../services/hardware.service');
const DevicesService = require('../services/devices.service');

class HardwareController {

    /**
     * Receive generic event from hardware (Heartbeat, Status, Log).
     * POST /api/hardware/event
     */
    static async logEvent(req, res, next) {
        try {
            const { device_uid, type, lat, lng, payload } = req.body;

            // 1. Validate Device
            const device = await DevicesService.findByUid(device_uid);
            if (!device) {
                return res.status(401).json({ status: 'error', message: 'Unknown Device UID' });
            }

            // 2. Log to Hardware Requests Table
            // Types could be: 'heartbeat', 'status', 'maintenance_log'
            const requestId = await HardwareService.createRequest({
                device_id: device.id,
                lat: lat || 0,
                lng: lng || 0,
                type: type || 'status',
                payload: payload || {}
            });

            res.status(200).json({ 
                status: 'success', 
                message: 'Event logged', 
                requestId 
            });

        } catch (error) { next(error); }
    }
}

module.exports = HardwareController;