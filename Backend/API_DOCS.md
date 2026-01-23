# ResQ Backend API Documentation

## 📋 Overview

ResQ is an emergency response system for vehicle accidents, providing real-time incident detection, ambulance dispatch, and hospital coordination.

**Base URL:** `http://localhost:3000/api` (or your deployment URL)

## 🔐 Authentication

Most endpoints require JWT authentication via Bearer token.

```http
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained through `/api/users/login` endpoint.

---

## 👥 Users API

### 1. Register User

**POST** `/api/users/register`

Create a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "phone": "+1234567890",
  "role": "user", // Optional: "admin", "hospital", "driver", "user"
  "lang": "en" // Optional: "en" or "ar"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "User registered",
  "data": { "userId": 5 }
}
```

### 2. Login

**POST** `/api/users/login`

Authenticate user and get JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

### 3. Get User Profile

**GET** `/api/users/profile`

Get current user's profile information.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "user",
      "lang": "en",
      "is_active": 1,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 4. Change Password (Self)

**PUT** `/api/users/change-password`

Change current user's password.

**Headers:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newsecure123"
}
```

### 5. Get All Users (Admin Only)

**GET** `/api/users`

**Headers:**

```http
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "status": "success",
  "count": 42,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Admin User",
        "email": "admin@resq.com",
        "phone": "+1234567890",
        "role": "admin",
        "lang": "en",
        "is_active": 1,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
      // ... more users
    ]
  }
}
```

### 6. Get User by ID (Admin Only)

**GET** `/api/users/:id`

**Path Parameters:**

- `id` - User ID

### 7. Update User

**PUT** `/api/users/:id`

Update user information. Admins can update any user, regular users can only update themselves.

**Path Parameters:**

- `id` - User ID

**Request Body (Partial):**

```json
{
  "name": "Updated Name",
  "phone": "+0987654321",
  "lang": "ar",
  "role": "hospital", // Admin only
  "is_active": 0 // Admin only
}
```

### 8. Reset User Password (Admin Only)

**PUT** `/api/users/:id/reset-password`

Force reset user's password.

**Path Parameters:**

- `id` - User ID

**Request Body:**

```json
{
  "newPassword": "forcedpassword123"
}
```

### 9. Delete User (Admin Only)

**DELETE** `/api/users/:id`

**Path Parameters:**

- `id` - User ID

---

## 🚑 Ambulances API

### 1. Add Ambulance (Admin Only)

**POST** `/api/ambulances`

Add a new ambulance to the system.

**Headers:**

```http
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "code": "AMB-001",
  "ambulance_phone": "+1234567890"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Ambulance added successfully",
  "data": { "ambulanceId": 3 }
}
```

### 2. Get All Ambulances

**GET** `/api/ambulances`

Get list of all ambulances.

**Headers:**

```http
Authorization: Bearer <token>
```

### 3. Get Ambulance by ID

**GET** `/api/ambulances/:id`

**Path Parameters:**

- `id` - Ambulance ID

### 4. Update Ambulance Details

**PUT** `/api/ambulances/:id`

Update ambulance information.

**Path Parameters:**

- `id` - Ambulance ID

**Request Body:**

```json
{
  "code": "AMB-001-UPDATED",
  "ambulance_phone": "+0987654321"
}
```

### 5. Delete Ambulance

**DELETE** `/api/ambulances/:id`

Delete ambulance (only if status is 'available' or 'offline').

**Path Parameters:**

- `id` - Ambulance ID

### 6. Update Ambulance Location

**PATCH** `/api/ambulances/:id/location`

Update ambulance GPS coordinates (for driver app).

**Path Parameters:**

- `id` - Ambulance ID

**Request Body:**

```json
{
  "lat": 30.0444,
  "lng": 31.2357
}
```

### 7. Test Nearest Ambulance

**GET** `/api/ambulances/test-nearest?lat=30.0444&lng=31.2357`

Find nearest available ambulance to given coordinates.

**Query Parameters:**

- `lat` - Latitude
- `lng` - Longitude

---

## 🏥 Hospitals API

### 1. Get Hospital Cases

**GET** `/api/hospitals/cases`

Get all active cases assigned to the logged-in hospital.

**Headers:**

```http
Authorization: Bearer <hospital_token>
```

### 2. Add Hospital (Admin Only)

**POST** `/api/hospitals`

Create new hospital profile.

**Headers:**

```http
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "user_id": 10,
  "name": "General Hospital",
  "city": "Cairo",
  "lat": 30.0444,
  "lng": 31.2357,
  "phone": "+1234567890",
  "country": "Egypt",
  "governorate": "Cairo",
  "street": "Main Street",
  "address_details": "Building 5, Floor 3"
}
```

### 3. Get All Hospitals

**GET** `/api/hospitals`

**Headers:**

```http
Authorization: Bearer <token>
```

### 4. Get Hospital by ID

**GET** `/api/hospitals/:id`

**Path Parameters:**

- `id` - Hospital ID

### 5. Update Hospital

**PUT** `/api/hospitals/:id`

**Path Parameters:**

- `id` - Hospital ID

### 6. Delete Hospital

**DELETE** `/api/hospitals/:id`

**Path Parameters:**

- `id` - Hospital ID

### 7. Update Patient Medical Status

**PUT** `/api/hospitals/cases/:incidentId/status`

Update patient medical status.

**Path Parameters:**

- `incidentId` - Incident ID

**Request Body:**

```json
{
  "status": "stable" // "unknown", "treatment", "critical", "stable", "discharged", "deceased"
}
```

---

## 🚨 Incidents API

### 1. Create Incident (Hardware)

**POST** `/api/incidents/create`

Create a new incident from hardware device.

**Request Body:**

```json
{
  "device_uid": "DEVICE-12345",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "g_force": 3.5
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Incident and Hardware Request logged successfully",
  "data": {
    "incidentId": 15,
    "hardwareRequestId": 28
  }
}
```

### 2. Get All Incidents (Admin Only)

**GET** `/api/incidents`

**Headers:**

```http
Authorization: Bearer <admin_token>
```

### 3. Get User Incident History

**GET** `/api/incidents/history`

Get incident history for the logged-in user.

**Headers:**

```http
Authorization: Bearer <token>
```

### 4. Get Incident by ID

**GET** `/api/incidents/:id`

Get detailed incident information.

**Path Parameters:**

- `id` - Incident ID

**Headers:**

```http
Authorization: Bearer <token>
```

### 5. Update Patient Status

**PUT** `/api/incidents/:incidentId/status`

Update patient medical status.

**Path Parameters:**

- `incidentId` - Incident ID

**Request Body:**

```json
{
  "status": "discharged"
}
```

---

## 📱 Devices API

### 1. Add Device (Admin Only)

**POST** `/api/devices`

Register a new hardware device.

**Headers:**

```http
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "device_uid": "DEVICE-12345",
  "user_id": 5,
  "car_plate": "ABC-123",
  "car_model": "Toyota Camry",
  "status": "active"
}
```

### 2. Get All Devices

**GET** `/api/devices`

**Headers:**

```http
Authorization: Bearer <token>
```

### 3. Get Device by UID

**GET** `/api/devices/uid/:uid`

**Path Parameters:**

- `uid` - Device UID string

### 4. Get Device by ID

**GET** `/api/devices/:id`

**Path Parameters:**

- `id` - Device database ID

### 5. Update Device

**PUT** `/api/devices/:id`

**Path Parameters:**

- `id` - Device ID

### 6. Delete Device

**DELETE** `/api/devices/:id`

**Path Parameters:**

- `id` - Device ID

---

## 🎛️ Hardware API

### 1. Log Hardware Event

**POST** `/api/hardware/event`

Log generic hardware events (heartbeat, status, maintenance).

**Request Body:**

```json
{
  "device_uid": "DEVICE-12345",
  "type": "heartbeat", // "heartbeat", "status", "maintenance_log"
  "lat": 30.0444,
  "lng": 31.2357,
  "payload": {
    "battery": 85,
    "signal": "strong"
  }
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Event logged",
  "requestId": 42
}
```

---

## 🔍 Visitor API

### 1. Search Device Status (Public)

**POST** `/api/visitor/search`

Public endpoint to search for device status by user ID.

**Request Body:**

```json
{
  "visitor_name": "Jane Smith",
  "visitor_email": "jane@example.com",
  "target_user_id": 5
}
```

**Response (Active Incident Found):**

```json
{
  "status": "success",
  "message": "Active incident found for this user.",
  "data": {
    "target_user_id": 5,
    "car_model": "Toyota Camry",
    "incident_status": "assigned",
    "last_update": "2024-01-15T14:30:00.000Z",
    "hospital": "General Hospital",
    "location": {
      "lat": 30.0444,
      "lng": 31.2357
    }
  }
}
```

**Response (No Active Incident):**

```json
{
  "status": "success",
  "message": "No active incidents found for this user.",
  "data": {
    "target_user_id": 5,
    "status": "Safe"
  }
}
```

### 2. Get Search History

**GET** `/api/visitor/history`

Get list of people who searched for current user's devices.

**Headers:**

```http
Authorization: Bearer <token>
```

---

## ⚙️ Settings API (Admin Only)

### 1. Get All Settings

**GET** `/api/settings`

**Headers:**

```http
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "settings": [
      {
        "key": "confirmation_timeout",
        "value": "10",
        "description": "Seconds to wait before confirming accident",
        "updated_at": "2024-01-15T10:30:00.000Z"
      },
      {
        "key": "search_radius",
        "value": "50",
        "description": "Search radius for ambulances in KM",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 2. Update Setting

**PUT** `/api/settings/:key`

**Path Parameters:**

- `key` - Setting key name

**Request Body:**

```json
{
  "value": "15"
}
```

---

## 📊 Audit API (Admin Only)

### 1. Get Audit Logs

**GET** `/api/audit`

Get all admin activity logs.

**Headers:**

```http
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "status": "success",
  "count": 150,
  "data": {
    "logs": [
      {
        "id": 1,
        "admin_user_id": 1,
        "admin_name": "Admin User",
        "admin_email": "admin@resq.com",
        "action": "CREATE",
        "target_table": "ambulances",
        "target_id": 3,
        "note": "Added new ambulance with code: AMB-001",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## 🌐 WebSocket Events

### Connection

Connect to WebSocket server:

```javascript
const socket = io("http://localhost:3000");
```

### Join Rooms

```javascript
// Join admin dashboard
socket.emit("join_dashboard");

// Join driver room
socket.emit("join_driver", ambulanceId);

// Join hospital room
socket.emit("join_hospital", hospitalId);
```

### Events Emitted by Client

#### 1. Report Accident

```javascript
socket.emit("report_accident", {
  device_uid: "DEVICE-12345",
  latitude: 30.0444,
  longitude: 31.2357,
  g_force: 3.5,
});
```

#### 2. Cancel Accident

```javascript
socket.emit("cancel_accident", {
  incidentId: 15,
});
```

#### 3. Update Driver Status

```javascript
socket.emit("update_driver_status", {
  ambulanceId: 3,
  status: "busy", // 'available', 'busy', 'offline'
});
```

#### 4. Complete Mission

```javascript
socket.emit("complete_mission", {
  incidentId: 15,
});
```

### Events Received by Client

#### Admin Dashboard Events

- `new_alert` - New incident detected
- `incident_cancelled` - Incident cancelled
- `incident_completed` - Mission completed
- `ambulance_status_changed` - Ambulance status updated

#### Driver App Events

- `request_rescue` - New rescue assignment
- `mission_cancelled` - Mission cancelled
- `mission_completed_ack` - Mission completion acknowledged
- `status_updated` - Status update confirmation

#### Hospital Dashboard Events

- `incoming_case` - New case assigned
- `mission_cancelled` - Case cancelled

#### Simulator Events

- `report_received` - Accident report acknowledged
- `error` - Error occurred

---

## 📝 Response Formats

### Success Response

```json
{
  "status": "success",
  "message": "Operation successful",
  "data": {}
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "status": "error",
  "message": "Missing required fields"
}
```

#### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Access Denied. No token provided."
}
```

#### 403 Forbidden

```json
{
  "status": "error",
  "message": "Invalid or Expired Token."
}
```

#### 404 Not Found

```json
{
  "status": "error",
  "message": "Resource not found"
}
```

#### 409 Conflict

```json
{
  "status": "error",
  "message": "Email already registered"
}
```

#### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal Server Error",
  "stack": "Error details..." // Only in development
}
```

---

## 🔧 Health Check

### System Status

**GET** `/`

**Response:**

```json
{
  "status": "success",
  "message": "ResQ Backend System is Online 🚑",
  "language_detected": "en",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📊 Database Schema Reference

### Main Tables

1. `users` - User accounts
2. `devices` - Hardware devices
3. `incidents` - Accident incidents
4. `ambulances` - Ambulance fleet
5. `hospitals` - Hospital profiles
6. `hardware_requests` - Raw hardware logs
7. `audit_admin_changes` - Admin activity logs
8. `visitor_searches` - Public search logs
9. `settings` - System configurations
10. `incident_logs` - Incident history logs

---

## 🔐 Role-Based Access Control

| Role       | Access Level                                   |
| ---------- | ---------------------------------------------- |
| `admin`    | Full system access                             |
| `hospital` | Hospital dashboard, patient status updates     |
| `driver`   | Ambulance location updates, mission management |
| `user`     | Personal profile, incident history             |

---

## 🚀 Quick Start Example

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Use Token for Protected Endpoint

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
