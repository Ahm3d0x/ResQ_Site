# ResQ Project - Development Status Log 🚑

> **Last Updated:** [Current Date]
> **Current Phase:** Phase 1 (Foundation & Setup)

## 1. Project Overview

- **System:** ResQ Emergency Response System.
- **Tech Stack:** Node.js, Express, MySQL, Socket.io.
- **Architecture:** Layered Architecture (Routes -> Controllers -> Services -> Data).
- **Languages:** Arabic (RTL) & English (LTR) Support.

## 2. Completed Modules & Files ✅

### A. Environment & Setup

- [x] **Project Init:** `package.json` created.
- [x] **Dependencies:** Installed `express`, `mysql2`, `dotenv`, `socket.io`, `cors`, `helmet`, `morgan`.
- [x] **Environment Variables:** `.env` file created (Database connection + JWT Secret).

### B. Database Layer (`src/config/db.js`)

- [x] **Connection Pool:** Implemented MySQL connection pool for high performance.
- [x] **Events:** Added listeners for `connection` and `error` monitoring.
- [x] **Async/Await:** Converted pool to Promise-based.
- [x] **Fail-Fast:** Added `testConnection()` to stop server if DB is down.
- [x] **Settings:** Configured `timezone: 'local'`, `dateStrings: true`.

### C. Application Core (`src/app.js`)

- [x] **Security:** Added `helmet` and `cors` middlewares.
- [x] **Logging:** Added `morgan('dev')` for request tracking.
- [x] **Parsing:** Enabled `json` and `urlencoded` parsers.
- [x] **Localization:** Implemented `req.lang` middleware to detect 'ar'/'en' from headers.
- [x] **Error Handling:**
  - Added 404 Catch-all handler.
  - Added **Global Error Handler** to return standardized JSON error responses.

### D. Server Entry Point (`src/server.js`) ✅

- **HTTP Server:** Wraps the Express app using Node's `http` module.
- **Real-Time Engine:** Integrated **Socket.io** server directly with the HTTP instance.
- **Global Access:** Configured `app.set('io', io)` to allow emitting events from any Controller or Service later.
- **Process Safety:** Added `unhandledRejection` and `uncaughtException` listeners to prevent silent crashes.
- **Boot Sequence:** Server initializes DB connection checks before accepting traffic.

---

**Status:** Phase 1 (Foundation) Completed Successfully.
**Next Phase:** Phase 2 (Users & Authentication Module).

## Phase 2: Users & Authentication 🔐

### A. Logic Layer (`src/services/users.service.js`) ✅

- [x] **Dependencies:** Installed `bcryptjs` (hashing) & `jsonwebtoken` (auth).
- [x] **Create User:** Implemented logic to hash passwords before DB insertion.
- [x] **Find User:** Implemented search by `email` (for login) and `id` (for profile).
- [x] **Security:** Ensured `findById` does not return the password hash.

### B. Controllers Layer (`src/controllers/users.controller.js`) ✅

- [x] **Logic:** Implemented `register` (with validation) and `login` (with bcrypt check).
- [x] **JWT:** Added Token generation logic in login.
- [x] **Response:** Used standardized JSON responses (Success/Error).

### C. Routes Layer (`src/routes/users.routes.js`) ✅

- [x] **Endpoints:** Defined `/register` and `/login` endpoints.
- [x] **Integration:** Linked Routes to `UsersController`.
- [x] **Mounting:** Updated `app.js` to serve routes under `/api/users`.

### D. Testing & Verification 🧪 ✅

- [x] **Registration Test:** Verified user creation in DB via Postman.
- [x] **Password Hashing:** Confirmed `bcrypt` encryption in phpMyAdmin.
- [x] **Login Test:** Successfully generated JWT Token upon valid credentials.
- [x] **Error Handling:** Verified duplicate email rejection (409 Conflict).

### E. Middleware Layer (`src/middleware/auth.js`) ✅

- [x] **JWT Verification:** Implemented logic to verify tokens from `Authorization` headers.
- [x] **Security:** Rejects requests with missing or invalid tokens (401/403).
- [x] **User Payload:** Attaches decoded user info (`req.user`) to the request object for downstream use.

### F. Testing Milestones 🧪

- [x] **Verified:** User Registration (Data inserted correctly with hashed password).
- [x] **Verified:** User Login (Valid JWT token received).
- [x] **Verified:** Duplicate email validation.
- [x] **Verified:** Protected Route (`/profile`) blocked unauthorized access & allowed valid tokens.

---

**Status:** Phase 2 (Users & Auth) COMPLETED. 🟢
**Next Phase:** Phase 3 (Devices & Hardware).

## Phase 3: Devices & Hardware Module 🚙

### A. Logic Layer (`src/services/devices.service.js`) ✅

- [x] **Create Device:** Links hardware UID to a User ID.
- [x] **Find by UID:** Joins `devices` with `users` to fetch owner info (Critical for alerts).
- [x] **Admin Listing:** Fetches all devices with owner details.
- [x] **Validation:** Added helper to check duplicate Device UIDs.

### B. Controller Layer (`src/controllers/devices.controller.js`) ✅

- [x] **Add Device:** Validates input, checks user existence, prevents duplicate UIDs, then creates device.
- [x] **List Devices:** Returns full list with owner details (Prepared for Admin Dashboard).
- [x] **Get One:** Added `getDeviceByUid` endpoint logic for future detail views or hardware checks.
- [x] **Error Handling:** Returns 404 if user not found, 409 if device already exists.

### C. Routes Layer (`src/routes/devices.routes.js`) ✅

- [x] **Endpoints:** Defined `/` (POST/GET) and `/:uid` (GET).
- [x] **Protection:** Applied `auth` middleware globally to all device routes.
- [x] **Mounting:** Registered `/api/devices` in `app.js`.

### D. Testing & Verification 🧪 ✅

- [x] **Add Device:** Verified via Postman (Data inserted & linked to user).
- [x] **List Devices:** Verified `JOIN` query returns device info + owner details.
- [x] **Security:** Confirmed that endpoints require valid Bearer Token.

---

**Status:** Phase 3 (Devices) COMPLETED. 🟢
**Next Phase:** Phase 4 (Incidents & Real-time Sockets).

## Phase 4: Incidents & Real-time System 🚑

### A. Logic Layer (`src/services/incidents.service.js`) ✅

- [x] **Create Incident:** Inserts new crash data (coords, g-force) linked to a device.
- [x] **Read Incident:** Fetches incident details joined with Device & User tables (for Dashboard).
- [x] **Update Status:** Logic to change status (pending -> dispatched).
- [x] **False Alarm:** Optimized SQL to mark false alarms and resolve status simultaneously.
- [x] **Database Schema Update:** Renamed coords to `latitude`/`longitude` and added `g_force` & `is_false_alarm` columns to match hardware payload.

### C. Real-time Simulation 🎮 ✅

- [x] **Socket Manager:** Implemented `report_accident` and `cancel_accident` events.
- [x] **Simulator:** Created Web GUI (`simulator.html`) to mock hardware behavior.
- [x] **Full Cycle Test:** Verified flow: Device -> Socket -> DB Insert -> Admin Alert.
- [x] **Cancellation:** Successfully implemented false alarm logic (Updates DB status to `resolved`).

---

**Status:** Phase 4 (Incidents & Real-time) COMPLETED. 🟢
**Next Phase:** Phase 5 (Ambulance Management & Dispatching).

### B. Controller Layer (`src/controllers/ambulances.controller.js`) ✅

- [x] **Add/List:** Standard CRUD for admin management.
- [x] **Location Update:** Endpoint for driver app to push GPS coords (`PATCH /:id/location`).
- [x] **Geo-Query Test:** Added helper endpoint to verify nearest neighbor logic.

### C. Routes Layer (`src/routes/ambulances.routes.js`) ✅

- [x] **Endpoints:** Defined POST, GET, PATCH routes.
- [x] **Routing Logic:** Ordered `test-nearest` before dynamic IDs to prevent routing conflicts.
- [x] **Security:** Applied `auth` middleware globally.
- [x] **Mounting:** Registered `/api/ambulances` in `app.js`.

### D. Testing & Verification 🧪 ✅

- [x] **Distance Calculation:** Verified `findNearestAvailable` returns the closest unit via Haversine formula.
- [x] **Data Integrity:** Confirmed `lat`/`lng` columns match Schema.

---

**Status:** Phase 5 (Ambulance Management) COMPLETED. 🟢
**Next Phase:** Phase 6 (Auto-Dispatching Logic).### D. Testing & Verification 🧪 ✅

- [x] **Distance Calculation:** Verified `findNearestAvailable` returns the closest unit via Haversine formula.
- [x] **Data Integrity:** Confirmed `lat`/`lng` columns match Schema.

---

**Status:** Phase 5 (Ambulance Management) COMPLETED. 🟢
**Next Phase:** Phase 6 (Auto-Dispatching Logic).

### B. Auto-Dispatch Logic 🧠 ✅

- [x] **Integration:** Linked `IncidentsService` with `AmbulancesService` inside Socket Manager.
- [x] **Logic:** Server automatically queries nearest `available` ambulance upon crash report.
- [x] **Assignment:** Updates incident DB record with `ambulance_id` and changes status to `dispatched`.
- [x] **Alerting:** Emits `request_rescue` event to the specific driver room via Socket.io.

---

**Status:** Phase 6 (Auto-Dispatching) COMPLETED. 🟢
**Next Phase:** Phase 7 (Driver Interface & Acceptance).

### Phase 7: Driver Interface & Simulator 🚑 📱 ✅

- [x] **Driver App GUI:** Created `driver.html` with Tailwind CSS mirroring a real ambulance tablet.
- [x] **Real-time Missions:** Implemented Socket.io listener for `request_rescue` events.
- [x] **Alert System:** Visual & UI alerts (Red flashing screen) upon mission assignment.
- [x] **Navigation Integration:** Added "Navigate to Location" button linking directly to Google Maps with crash coordinates.
- [x] **Full System Test:** Verified the complete flow: Hardware Crash -> Server Logic -> Auto-Dispatch -> Driver Alert -> Navigation.

---

**Status:** Phase 7 (Driver App) COMPLETED. 🟢
**Next Phase:** Phase 8 (Final Polish & Deployment Preparation).

# Project Status

**Status:** Phase 8 (Refactoring & System Hardening) **COMPLETED** 🟢  
**Next Phase:** Phase 9 (Frontend Integration)

---

## Phase 9: Admin Management & Audit System 🛡️

### **A. Audit System** ✅

- **Database:** Created `audit_admin_changes` table to track administrative actions
- **Service Layer:** Implemented `AuditService.log()` to record CREATE, UPDATE, and DELETE actions
- **Integration:** Linked Audit Service to all Controllers (Devices, Ambulances)
- **API:** Created endpoint `GET /api/audit` for the Admin Dashboard logs view

### **B. Fleet Management Refactor** ✅

- **Decoupling:** Removed `hospital_id` dependency — ambulances are now independent entities
- **Schema Update:** Replaced `driver_phone` with `ambulance_phone` to reflect vehicle-based tracking
- **Full CRUD:** Implemented GetOne, Update, and Delete endpoints
- **Safety Logic:** Prevented deletion of ambulances with `busy` or `online` status

### **C. Device Management & Hardware Logs** ✅

- **Full CRUD:** Added Update and Delete logic for Devices with Audit logging
- **Hardware Service:** Created `HardwareService` to log all request types (alert, cancel, heartbeat)
- **Cancel Logic:** Updated Socket Manager to log `cancel_accident` events into the database for historical tracking
- **HTTP Events:** Added `HardwareController` to accept non-emergency logs (Heartbeats) via HTTP

### **D. Testing & Verification** 🧪 ✅

- **Audit Test:** Verified that creating/deleting a device creates a row in the Audit table
- **Hardware Test:** Verified that Simulator Cancellation creates a cancel record in `hardware_requests`
- **Refactor Test:** Confirmed `findNearestAvailable` still works with the new independent ambulance schema
  Here is the documentation for the **Hospitals Module** updates. You can append this to your `API_DOCS.md` file.

It includes the new Admin CRUD operations (Create, Read One, Update, Delete) and the existing Hospital Dashboard route.
