/**
 * src/sockets/socketManager.js
 * Description: Centralized Socket.io handler with Dynamic Settings & Full Logging.
 */

const IncidentsService = require('../services/incidents.service');
const DevicesService = require('../services/devices.service');
const AmbulancesService = require('../services/ambulances.service');
const HospitalsService = require('../services/hospitals.service');
const HardwareService = require('../services/hardware.service');
const SettingsService = require('../services/settings.service'); // 👈 استيراد خدمة الإعدادات
const db = require('../config/db');

let io;

// Map to store active timers for pending incidents
// Key: incidentId, Value: TimerObject
const confirmationTimers = new Map();

const initSocket = (ioInstance) => {
    io = ioInstance;

    io.on('connection', (socket) => {
        
        socket.setMaxListeners(20);

        // --- 1. ROOM MANAGEMENT ---
        socket.on('join_dashboard', () => { socket.join('admins'); });
        socket.on('join_driver', (id) => { socket.join(`driver_${id}`); });
        socket.on('join_hospital', (id) => { socket.join(`hospital_${id}`); });

        // --- 2. DRIVER STATUS ---
        socket.on('update_driver_status', async (data) => {
            try {
                const { ambulanceId, status } = data;
                await AmbulancesService.updateStatus(ambulanceId, status);
                io.to('admins').emit('ambulance_status_changed', { ambulanceId, status });
                socket.emit('status_updated', { status });
            } catch (error) { console.error(error); }
        });

        // --- 3. REPORT ACCIDENT (DYNAMIC LOGIC ⚙️) ---
        socket.on('report_accident', async (data) => {
            console.log('🚨 EVENT: report_accident received', data);

            try {
                const { device_uid, latitude, longitude, g_force } = data;

                // 1. Validate Device
                const device = await DevicesService.findByUid(device_uid);
                if (!device) return socket.emit('error', { message: 'Unauthorized' });

                // 2. Log Hardware Request
                const hwRequestId = await HardwareService.createRequest({
                    device_id: device.id, lat: latitude, lng: longitude, type: 'alert', payload: data
                });

                // 3. Create Incident as PENDING
                const incidentId = await IncidentsService.createIncident({
                    device_id: device.id, user_id: device.user_id, hardware_request_id: hwRequestId,
                    latitude, longitude, g_force: g_force || 0
                });
                await HardwareService.updateIncidentId(hwRequestId, incidentId);

                // 🔥 DYNAMIC SETTINGS FETCH 🔥
                // جلب قيمة وقت الانتظار من الداتابيز، وإذا لم توجد نستخدم 10 كقيمة افتراضية
                let timeoutSeconds = 10;
                try {
                    const settingVal = await SettingsService.getByKey('confirmation_timeout');
                    if (settingVal) timeoutSeconds = parseInt(settingVal);
                } catch (err) {
                    console.error('⚠️ Failed to fetch settings, using default 10s:', err.message);
                }
                
                const timeoutMs = timeoutSeconds * 1000;

                console.log(`⏳ Incident #${incidentId} is PENDING. Waiting ${timeoutSeconds}s for cancellation...`);

                // 4. Notify Admin
                io.to('admins').emit('new_alert', {
                    id: incidentId, location: { lat: latitude, lng: longitude },
                    status: 'pending', assigned_ambulance: 'Waiting...', assigned_hospital: 'Waiting...'
                });
                
                // Ack to Simulator
                socket.emit('report_received', { status: 'success', incidentId, dispatched: false });

                // 5. START DYNAMIC TIMER 🕒
                const timer = setTimeout(async () => {
                    console.log(`⏰ Time is up! Confirming Incident #${incidentId}...`);
                    confirmationTimers.delete(incidentId);

                    // --- DISPATCH LOGIC ---
                    try {
                        // A. Find Resources
                        const nearestAmbulance = await AmbulancesService.findNearestAvailable(latitude, longitude);
                        const nearestHospital = await HospitalsService.findNearest(latitude, longitude);

                        let dispatchStatus = 'confirmed';
                        let assignedAmbulance = null;
                        let assignedHospital = null;

                        if (nearestAmbulance && nearestHospital) {
                            // Assign Resources
                            await IncidentsService.assignAmbulance(incidentId, nearestAmbulance.id);
                            await IncidentsService.assignHospital(incidentId, nearestHospital.id);
                            
                            // Update Status
                            await db.query("UPDATE incidents SET status = 'assigned', confirmed_at = NOW() WHERE id = ?", [incidentId]);
                            
                            // Mark Ambulance Busy
                            await AmbulancesService.updateStatus(nearestAmbulance.id, 'busy');
                            io.to('admins').emit('ambulance_status_changed', { ambulanceId: nearestAmbulance.id, status: 'busy' });

                            assignedAmbulance = nearestAmbulance;
                            assignedHospital = nearestHospital;
                            dispatchStatus = 'assigned';

                            // Notify Driver
                            io.to(`driver_${nearestAmbulance.id}`).emit('request_rescue', {
                                incidentId,
                                crash_location: { lat: latitude, lng: longitude },
                                hospital_location: { lat: nearestHospital.lat, lng: nearestHospital.lng, name: nearestHospital.name },
                                car_plate: device.car_plate, car_model: device.car_model, g_force
                            });

                            // Notify Hospital
                            io.to(`hospital_${nearestHospital.id}`).emit('incoming_case', {
                                incidentId, ambulance_code: nearestAmbulance.code, g_force, timestamp: new Date()
                            });

                            console.log(`🚀 Incident #${incidentId} Dispatched (Amb #${nearestAmbulance.id}).`);

                        } else {
                            // No Resources Found
                            await db.query("UPDATE incidents SET status = 'confirmed', confirmed_at = NOW() WHERE id = ?", [incidentId]);
                            console.warn(`⚠️ Incident #${incidentId} Confirmed but NO RESOURCES found.`);
                        }

                        // Update Admin Dashboard
                        io.to('admins').emit('new_alert', {
                            id: incidentId,
                            location: { lat: latitude, lng: longitude },
                            status: dispatchStatus,
                            assigned_ambulance: assignedAmbulance ? assignedAmbulance.code : 'Searching...',
                            assigned_hospital: assignedHospital ? assignedHospital.name : 'Searching...'
                        });

                    } catch (err) { console.error("Dispatch Error:", err); }

                }, timeoutMs); // 👈 استخدام المتغير الديناميكي هنا

                confirmationTimers.set(incidentId, timer);

            } catch (error) {
                console.error('Error:', error.message);
                socket.emit('error', { message: 'Server Error' });
            }
        });

        // --- 5. CANCELLATION (LOGIC + LOGGING) ---
        socket.on('cancel_accident', async (data) => {
            const { incidentId } = data;
            console.log(`↩️ Cancel Request for Incident #${incidentId}`);

            try {
                const incident = await IncidentsService.getIncidentById(incidentId);

                // 🔥 LOGGING: Register cancel event
                if (incident) {
                    await HardwareService.createRequest({
                        device_id: incident.device_id,
                        type: 'cancel',
                        payload: { action: 'cancel_accident', incidentId, timestamp: new Date() },
                        incident_id: incidentId
                    });
                }

                // SCENARIO A: Cancel within grace period
                if (confirmationTimers.has(incidentId)) {
                    console.log(`🛑 Stopping Timer for Incident #${incidentId}. False Alarm.`);
                    clearTimeout(confirmationTimers.get(incidentId));
                    confirmationTimers.delete(incidentId);
                    
                    await IncidentsService.markAsFalseAlarm(incidentId);
                    io.to('admins').emit('incident_cancelled', { incidentId });
                    return; 
                }

                // SCENARIO B: Cancel AFTER dispatch
                console.log(`⚠️ Cancelling Active Incident #${incidentId} (After Dispatch).`);
                await IncidentsService.markAsFalseAlarm(incidentId);

                if (incident) {
                    if (incident.assigned_ambulance_id) {
                        await AmbulancesService.updateStatus(incident.assigned_ambulance_id, 'available');
                        io.to(`driver_${incident.assigned_ambulance_id}`).emit('mission_cancelled');
                        io.to('admins').emit('ambulance_status_changed', { 
                            ambulanceId: incident.assigned_ambulance_id, status: 'available' 
                        });
                    }
                    if (incident.assigned_hospital_id) {
                        io.to(`hospital_${incident.assigned_hospital_id}`).emit('mission_cancelled', { incidentId });
                    }
                }
                io.to('admins').emit('incident_cancelled', { incidentId });

            } catch (error) { console.error('Cancel Error:', error); }
        });

        // --- 6. COMPLETE MISSION ---
        socket.on('complete_mission', async (data) => {
            try {
                const { incidentId } = data;
                const result = await IncidentsService.completeMission(incidentId);
                
                if (result.ambulanceId) {
                    io.to(`driver_${result.ambulanceId}`).emit('mission_completed_ack');
                    io.to('admins').emit('ambulance_status_changed', { ambulanceId: result.ambulanceId, status: 'available' });
                }
                io.to('admins').emit('incident_completed', { incidentId });
            } catch (e) { console.error(e); }
        });
    });
};

module.exports = { initSocket };