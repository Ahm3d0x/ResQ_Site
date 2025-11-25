# **ResQ >> Full Database Documentation (MySQL)**

Professional, production-ready database documentation generated from the official ResQ system plan. This file is ready to publish directly on **GitHub**.

---

# 📌 **1. Introduction**

This documentation describes the full **MySQL database architecture** used by the **ResQ Vehicle Accident Detection & Emergency Response System**.

The system connects vehicle‑installed hardware devices to a backend that detects accidents, confirms them, assigns ambulances, and notifies hospitals — all in **real time**.

This documentation is fully aligned with the system plan:
**ResQ website plan.pdf**

---

# 📌 **2. Technologies Used**

The database MUST comply with the system's strict technology rules:

* **MySQL** as the only database engine.
* `utf8mb4` charset for **full English + Arabic support**.
* Database accessed only through:

  * **Node.js** backend
  * **Express.js** API layer

---

# 📌 **3. Entity Relationship Overview (ERD Summary)**

Main Entities:

* Users
* Devices
* Hospitals
* Ambulances
* HardwareRequests
* Incidents
* IncidentLogs

Relationships:

* User ↦ many Devices
* Device ↦ many HardwareRequests
* Device ↦ many Incidents
* Hospital ↦ one User (role = hospital)
* Hospital ↦ many Incidents
* Ambulance ↦ many Incidents
* Incident ↦ many IncidentLogs

---

# 📌 **4. Global Recommended MySQL Settings**

```sql
CREATE DATABASE resq
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE resq;
```

---

# 📌 **5. Table Documentation**

Each table includes: purpose, fields, constraints, relationships, and recommended indexes.

---

# 🧩 **5.1 Users Table** (`users`)

### Purpose

Stores all system accounts:

* Admins
* Vehicle Owners
* Hospital Accounts

### Key Fields

* `id` — primary user ID
* `role` — admin / user / hospital
* `lang` — preferred interface language (`en` or `ar`)
* `email` — login identifier (unique)
* `password_hash` — encrypted password

### Relationships

* One User → Many Devices
* One User (role = hospital) → One Hospital

---

# 🧩 **5.2 Devices Table** (`devices`)

### Purpose

Represents a hardware device installed inside a vehicle.

### Key Fields

* `device_uid` — unique hardware ID
* `user_id` — owner of this device
* `car_plate`, `car_model`
* `status` — active / inactive / maintenance

### Relationships

* Device ↦ belongs to one User
* Device ↦ many HardwareRequests
* Device ↦ many Incidents

---

# 🧩 **5.3 Hospitals Table** (`hospitals`)

### Purpose

Stores hospital details, location, and assigned user account.

### Key Fields

* `user_id` — owner account (role = hospital)
* `lat`, `lng` — precise coordinates
* Full detailed address

### Relationships

* Hospital ↦ belongs to one User
* Hospital ↦ many Incidents

---

# 🧩 **5.4 Ambulances Table** (`ambulances`)

### Purpose

Tracks each ambulance’s status and latest GPS location.

### Key Fields

* `code` — unique ambulance identifier
* `status` — available / busy / offline / en_route_incident / en_route_hospital
* `lat`, `lng`

### Relationships

* Ambulance ↦ many Incidents

---

# 🧩 **5.5 Hardware Requests Table** (`hardware_requests`)

### Purpose

Stores **raw JSON requests** coming from the hardware device.

### Key Fields

* `request_type` — alert / cancel / heartbeat / status
* `raw_payload` — full JSON sent from device
* Optional: `incident_id`

### Relationships

* One Device → Many HardwareRequests
* Optional link → Incident

---

# 🧩 **5.6 Incidents Table** (`incidents`)

### Purpose

Represents a complete accident case.

### Key Fields

* `status`: pending / confirmed / canceled / assigned / in_progress / completed
* `mode`: auto / manual
* `assigned_ambulance_id`
* `assigned_hospital_id`
* `hardware_request_id`

### Core Timestamps

* `created_at`
* `confirmed_at`
* `resolved_at`

### Relationships

* Incident → Device
* Incident → User
* Incident → Hospital
* Incident → Ambulance
* Incident → Many IncidentLogs

---

# 🧩 **5.7 Incident Logs Table** (`incident_logs`)

### Purpose

Stores the entire timeline of actions taken on an incident.

### Key Fields

* `action` — created / confirmed / assigned_ambulance … etc.
* `performed_by` — system / admin:ID / device:UID
* `note` — optional details

### Relationships

* Many logs → One Incident

---

# 📌 **6. Full MySQL CREATE TABLE Statements**

Below are the final recommended table definitions (ready to run). They match the system plan exactly.

✔ utf8mb4 enabled
✔ All timestamps managed
✔ Full English & Arabic support
✔ Designed for Node.js + Express + Socket.io backend

---

## 🔹 `users`

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role ENUM('admin','user','hospital') NOT NULL DEFAULT 'user',
  lang CHAR(2) NOT NULL DEFAULT 'en',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role(role)
);
```

---

## 🔹 `devices`

```sql
CREATE TABLE devices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_uid VARCHAR(128) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  car_plate VARCHAR(50),
  car_model VARCHAR(150),
  status ENUM('active','inactive','maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔹 `hospitals`

```sql
CREATE TABLE hospitals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  governorate VARCHAR(100),
  city VARCHAR(100),
  street VARCHAR(255),
  address_details VARCHAR(500),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  phone VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_location(lat, lng)
);
```

---

## 🔹 `ambulances`

```sql
CREATE TABLE ambulances (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  status ENUM('available','busy','offline','en_route_incident','en_route_hospital') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status(status)
);
```

---

## 🔹 `hardware_requests`

```sql
CREATE TABLE hardware_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id BIGINT UNSIGNED NOT NULL,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  request_type ENUM('alert','cancel','heartbeat','status') NOT NULL,
  raw_payload JSON NOT NULL,
  incident_id BIGINT UNSIGNED NULL,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device(device_id)
);
```

---

## 🔹 `incidents`

```sql
CREATE TABLE incidents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  hardware_request_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','confirmed','canceled','assigned','in_progress','completed') DEFAULT 'pending',
  mode ENUM('auto','manual') DEFAULT 'auto',
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  assigned_ambulance_id BIGINT UNSIGNED NULL,
  assigned_hospital_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP NULL,
  resolved_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (hardware_request_id) REFERENCES hardware_requests(id),
  FOREIGN KEY (assigned_ambulance_id) REFERENCES ambulances(id),
  FOREIGN KEY (assigned_hospital_id) REFERENCES hospitals(id)
);
```

---

## 🔹 `incident_logs`

```sql
CREATE TABLE incident_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  incident_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(100) NOT NULL,
  performed_by VARCHAR(100) NOT NULL,
  note VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  INDEX idx_incident(incident_id)
);
```

---

# 📌 **7. 10‑Second Confirmation Logic (Backend + DB)**

The DB stores:

* `status = 'pending'`
* Timer deadline (backend)
* HardwareRequests → event trace

Backend Worker:

* Waits 10 seconds
* If `cancel` request found → status = canceled
* Else → status = confirmed
* Then backend assigns ambulance + hospital

---

# 📌 **8. Backup & Archiving Recommendations**

* Daily full SQL dump
* Hourly binary logs (binlog)
* Archive old hardware_requests
* Index maintenance every 30–60 days

---

# 📌 **9. Security Guidelines**

* Only store `password_hash` (bcrypt/argon2)
* No plaintext passwords
* Restrict DB user permissions
* Use prepared statements (Node/MySQL2)
* Log all critical actions in `incident_logs`

---

# 📌 **10. Final Notes**

This database design:

* Matches the official system workflow
* Supports Arabic + English fully
* Works with Node.js + Express + Socket.io
* Fits real-time updates and heavy device traffic
* Ready to publish directly on **GitHub** as `DATABASE.md`

---
