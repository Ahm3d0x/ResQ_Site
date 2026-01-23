// File: src/controllers/visitor.controller.js
const VisitorService = require('../services/visitor.service');

class VisitorController {

    /**
     * Public Search: Visitor searches for status by USER ID.
     */
    static async searchDevice(req, res, next) {
        try {
            // 👇 التغيير هنا: نستقبل target_user_id بدلاً من device_uid
            const { visitor_name, visitor_email, target_user_id } = req.body;

            // 1. Validation
            if (!visitor_name || !visitor_email || !target_user_id) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Name, Email, and Target User ID are required.' 
                });
            }

            // 2. Find Incident Data by User ID
            const incidentData = await VisitorService.findLatestIncidentByUserId(target_user_id);
            
            // 3. Log the search
            await VisitorService.logSearch({
                visitor_name,
                visitor_email,
                // If incident found, we log the actual device UID. If not, we pass null (Service handles placeholder)
                device_uid_searched: incidentData ? incidentData.device_uid : null,
                search_query_raw: target_user_id.toString(), // Store the input ID
                incident_id: incidentData ? incidentData.incident_id : null
            });

            // 4. Response
            if (incidentData && incidentData.status !== 'completed' && incidentData.status !== 'resolved') {
                return res.status(200).json({
                    status: 'success',
                    message: 'Active incident found for this user.',
                    data: {
                        target_user_id,
                        car_model: incidentData.car_model, // Useful info
                        incident_status: incidentData.status,
                        last_update: incidentData.updated_at,
                        hospital: incidentData.hospital_name || 'Not assigned yet',
                        location: { lat: incidentData.latitude, lng: incidentData.longitude }
                    }
                });
            } else {
                return res.status(200).json({
                    status: 'success',
                    message: 'No active incidents found for this user.',
                    data: {
                        target_user_id,
                        status: 'Safe'
                    }
                });
            }

        } catch (error) { next(error); }
    }

    static async getMySearchHistory(req, res, next) {
        // ... (نفس الكود القديم)
        try {
            const userId = req.user.id;
            const history = await VisitorService.getSearchHistoryForUser(userId);
            res.status(200).json({ status: 'success', count: history.length, data: { history } });
        } catch (error) { next(error); }
    }
}

module.exports = VisitorController;