# **ResQ >> Full MySQL Database Documentation**

---

# 📘 **1. Introduction**

This document provides the **complete and updated database documentation** for the **ResQ Emergency Response System**, which integrates smart hardware installed in vehicles to automatically detect accidents, confirm incidents, assign ambulances, and notify hospitals in real time.

This documentation fully supports the system features described in the project plan, including:

* Real‑time incident creation
* 10‑second confirmation workflow
* Automatic & manual ambulance assignment
* Multi‑dashboard access (Admin, User, Hospital, Visitor)
* Full English & Arabic language support
* Logging hardware activity and visitor public searches

---

# 📌 **2. Technology & Design Constraints**

The system strictly uses the following technologies:

* **MySQL** — main relational database
* **Node.js + Express** — backend runtime & API
* **Socket.io** — real‑time communication
* **HTML, TailwindCSS, Vanilla JS** — frontend

Database encoding:

```
CHARACTER SET: utf8mb4
COLLATION: utf8mb4_general_ci
```

This ensures **full Arabic + English support**.

---

# 📌 **3. Global Database Settings**

```sql
CREATE DATABASE resq
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE resq;
```

---

# 📌 **4. Entity Overview (Tables List)**

The ResQ system contains the following core tables:

1. **users** – all system accounts
2. **devices** – hardware installed in vehicles
3. **hospitals** – hospital information
4. **ambulances** – ambulance vehicle tracking
5. **hardware_requests** – raw device requests
6. **incidents** – accident cases
7. **incident_logs** – historical timeline of incident activity
8. **visitor_searches** – public visitor search attempts *(NEW)*

---

# 📌 **5. Table Documentation**

Each table includes: purpose, field details, relationships, and SQL creation.

---

# 🧩 **5.1 Users Table (`users`)**

### Purpose

Stores all system accounts: Admins, Vehicle Owners, and Hospital Accounts.

### Key Fields

* `name`, `email`, `phone`
* `role`: admin/user/hospital
* `lang`: preferred UI language (en/ar)
* `is_active`: account status

### SQL

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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

# 🧩 **5.2 Devices Table (`devices`)**

### Purpose

Represents hardware installed inside vehicles.

### SQL

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

# 🧩 **5.3 Hospitals Table (`hospitals`)**

### Purpose

Stores hospital details, address, and location.

### SQL

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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

# 🧩 **5.4 Ambulances Table (`ambulances`)**

### Purpose

Tracks ambulance vehicles and their last known location.

### SQL

```sql
CREATE TABLE ambulances (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  status ENUM('available','busy','offline','en_route_incident','en_route_hospital') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

# 🧩 **5.5 Hardware Requests Table (`hardware_requests`)**

### Purpose

Stores **raw JSON** data coming from hardware installed in vehicles.

### SQL

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
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);
```

---

# 🧩 **5.6 Incidents Table (`incidents`)**

### Purpose

Represents an accident or emergency detected by a device.

### SQL

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

# 🧩 **5.7 Incident Logs Table (`incident_logs`)**

### Purpose

Tracks all changes and events related to an incident.

### SQL

```sql
CREATE TABLE incident_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  incident_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(100) NOT NULL,
  performed_by VARCHAR(100) NOT NULL,
  note VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);
```

---

# 🧩 **5.8 Visitor Searches Table (`visitor_searches`)**

### Purpose

Logs public visitor search attempts for a Device UID from the landing page.

### SQL

```sql
CREATE TABLE visitor_searches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visitor_name VARCHAR(200) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  device_uid_searched VARCHAR(128) NOT NULL,
  search_query_raw VARCHAR(255) NULL,
  incident_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE SET NULL
);
```

---

# 📌 **6. 10‑Second Confirmation Workflow**

* Device sends `alert` → incident created in `pending` state
* User has **10 seconds** to cancel
* If canceled → status becomes `canceled`
* If no cancel → backend marks incident `confirmed`
* System assigns nearest ambulance & nearest hospital
* All steps logged in `incident_logs`

---

# 📌 **7. Relationships Summary**

* **User → Devices → Incidents → IncidentLogs**
* **Device → HardwareRequests**
* **Ambulance → Incidents**
* **Hospital → Incidents**
* **Visitor → visitor_searches → optional Incident**

---

# 📌 **8. ER Diagram Structure**

*(Textual description for GitHub — PNG version can be generated separately)*

* `users` 1—∞ `devices`
* `devices` 1—∞ `hardware_requests`
* `devices` 1—∞ `incidents`
* `users` 1—∞ `incidents`
* `incidents` 1—∞ `incident_logs`
* `ambulances` 1—∞ `incidents`
* `hospitals` 1—∞ `incidents`
* `visitor_searches` 0/1 — 1 `incidents``

---

# 📌 **9. Backup & Maintenance**

* Daily full backup
* Hourly binlog incremental
* Archive old hardware_requests
* Monitor incident volume for scaling

---

# 🎉 **10. End of Documentation**

 **ResQ MySQL Database**
