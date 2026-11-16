# SYSTEM DESIGN & ARCHITECTURE DOCUMENT

**Project:** Attendance Monitoring System Using Face Recognition for Students  
**Version:** 1.0 | **Date:** August 2025

---

## 1. Architectural Overview

### 1.1 Three-Tier Architecture

The system follows a classical **Three-Tier (3-Tier) Architecture**:

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                          │
│                  (React.js SPA Frontend)                      │
│   Browser renders pages, handles webcam, calls REST APIs      │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP REST (JSON)
                            │ Authorization: Bearer JWT
┌───────────────────────────▼──────────────────────────────────┐
│                    BUSINESS LOGIC TIER                        │
│                  (FastAPI Python Backend)                      │
│   Handles authentication, recognition, attendance logic       │
└───────────────────────────┬──────────────────────────────────┘
                            │ SQLAlchemy ORM
                            │ SQL queries
┌───────────────────────────▼──────────────────────────────────┐
│                       DATA TIER                               │
│                    (SQLite Database)                          │
│   Persists students, attendance, subjects, settings           │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Deployment Diagram

```
┌──────────────────── Developer Workstation ──────────────────┐
│                                                              │
│  ┌─────────────────────┐    ┌──────────────────────────┐    │
│  │   Web Browser       │    │   Python Process          │    │
│  │   Port 5173/5174    │◄──►│   Port 8000               │    │
│  │   (Vite Dev Server) │    │   (uvicorn + FastAPI)     │    │
│  └─────────────────────┘    └──────────────┬───────────┘    │
│                                             │                │
│  ┌─────────────────────┐    ┌──────────────▼───────────┐    │
│  │   Webcam Device     │    │   SQLite File             │    │
│  │   (USB/Built-in)    │    │   attendance.db           │    │
│  └─────────────────────┘    └──────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. System Flow Design

### 2.1 Request-Response Flow

```
Browser                    FastAPI                  SQLite / Face Engine
   │                          │                           │
   │─── POST /auth/login ────►│                           │
   │                          │── SELECT admin ──────────►│
   │                          │◄── admin row ─────────────│
   │                          │── verify bcrypt ──────────│
   │◄── JWT token ────────────│                           │
   │                          │                           │
   │─── GET /students ────────│                           │
   │    Authorization: Bearer │                           │
   │                          │── validate JWT ───────────│
   │                          │── SELECT students ────────►│
   │◄── JSON list ────────────│◄── rows ──────────────────│
   │                          │                           │
   │─── POST /face/recognize ►│                           │
   │    (image blob)          │── load all encodings ────►│
   │                          │── run recognition engine  │
   │                          │── compare distances ───── │
   │◄── {student_id, name...} │                           │
```

### 2.2 Attendance Marking Flow

```
┌─────────────┐
│  Admin opens│
│ TakeAttend. │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────────┐
│ Select      │────►│  Enumerate Webcam │
│ Webcam      │     │  Devices via API  │
└──────┬──────┘     └──────────────────┘
       │
       ▼
┌─────────────┐
│Start Camera │
│ getUserMedia│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│   Auto-scan loop (3s)       │
│   capture frame → canvas   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────────┐
│ POST frame  │────►│  Backend detects │
│ to API      │     │  face in image   │
└─────────────┘     └──────────┬───────┘
                               │
                    ┌──────────▼───────┐
                    │ Compute 128D     │
                    │ face encoding    │
                    └──────────┬───────┘
                               │
                    ┌──────────▼───────┐
                    │ Compare against  │
                    │ all stored enc.  │
                    └──────────┬───────┘
                               │
               ┌───────────────┴──────────────┐
               │                              │
    Match found (d < threshold)        No match
               │                              │
    ┌──────────▼───────┐          ┌───────────▼──────┐
    │ Check duplicate  │          │ Return recognized │
    │ attendance today │          │ = false           │
    └──────────┬───────┘          └───────────────────┘
               │
    Already    │    First time
    marked     │    today
    today      │
       │       ▼
       │  ┌────────────┐
       │  │Mark Present│
       │  │ in DB      │
       │  └────────────┘
       │
    ┌──▼──────────────┐
    │ Return response │
    │ to frontend     │
    └─────────────────┘
```

---

## 3. Module Design

### 3.1 Frontend Module Design

```
App.jsx (Router)
├── /login          → Login.jsx
│                     ├── Left panel (dark blue, face wireframe)
│                     └── Right panel (form card)
│
└── MainLayout.jsx (Protected route wrapper)
    ├── Sidebar.jsx
    │   ├── Shield+Face logo
    │   ├── NavLinks (Dashboard, Students...)
    │   └── Logout button
    │
    ├── Header (dark bar: hamburger, date, avatar)
    │
    └── Page Content (white area)
        ├── /dashboard          → Dashboard.jsx
        │   ├── Stat cards (4)
        │   ├── Recent attendance table
        │   └── Quick actions panel
        │
        ├── /students           → Students.jsx
        │   ├── Stat cards (4)
        │   ├── Filter bar
        │   └── Paginated table
        │
        ├── /students/register  → StudentRegister.jsx
        │   └── Registration form
        │
        ├── /face-registration  → FaceRegistration.jsx
        │   ├── Webcam picker
        │   ├── Camera feed
        │   ├── Sample squares
        │   └── Instructions
        │
        ├── /attendance         → TakeAttendance.jsx
        │   ├── Webcam picker
        │   ├── Camera feed
        │   └── Recognition info
        │
        ├── /attendance-records → AttendanceRecords.jsx
        │   ├── Filter bar
        │   ├── Table with checkboxes
        │   └── Action buttons
        │
        ├── /subjects           → Subjects.jsx
        │   ├── Stat cards
        │   ├── Filter + table
        │   └── Add/Edit modal
        │
        ├── /reports            → Reports.jsx
        │   ├── Report type radio
        │   ├── Date picker
        │   ├── Stat cards
        │   └── Pie chart
        │
        └── /settings           → Settings.jsx
            ├── App settings form
            ├── Backup card
            └── Restore card
```

### 3.2 Backend Module Design

```
app/
├── main.py
│   ├── FastAPI instance
│   ├── CORS middleware
│   ├── Router includes
│   └── Startup: init DB + seed
│
├── database.py
│   ├── SQLAlchemy engine (SQLite)
│   ├── SessionLocal factory
│   └── Base declarative
│
├── models/
│   ├── admin.py        → Admin table
│   ├── student.py      → Student table
│   ├── subject.py      → Subject table
│   ├── attendance.py   → Attendance table
│   └── settings.py     → AppSettings table
│
├── schemas/
│   ├── auth.py         → LoginRequest, Token
│   ├── student.py      → StudentCreate, StudentResponse
│   ├── subject.py      → SubjectCreate, SubjectResponse
│   └── attendance.py   → AttendanceMark, AttendanceResponse
│
├── authentication/
│   └── auth.py
│       ├── hash_password()
│       ├── verify_password()
│       ├── create_access_token()
│       └── get_current_admin() (dependency)
│
├── routers/
│   ├── auth.py         → POST /login, GET /me
│   ├── students.py     → CRUD /students
│   ├── subjects.py     → CRUD /subjects
│   ├── attendance.py   → GET/POST/DELETE /attendance
│   ├── face_recognition.py → POST /face/register, /face/recognize
│   ├── dashboard.py    → GET /dashboard/stats, /recent-attendance
│   ├── reports.py      → GET /reports/generate, /export/csv, /export/excel
│   └── settings.py     → GET/PUT /settings, /backup, /restore
│
└── utils/
    ├── seed_data.py    → Admin + default settings seeding
    └── face_utils.py   → Encoding load/save helpers
```

---

## 4. Database Schema Design

### 4.1 Entity Relationship (Logical)

```
┌──────────────┐          ┌──────────────┐
│    admins    │          │   settings   │
├──────────────┤          ├──────────────┤
│ id (PK)      │          │ id (PK)      │
│ username     │          │ app_name     │
│ hashed_pwd   │          │ threshold    │
│ full_name    │          │ cam_index    │
│ is_active    │          │ cam_res      │
│ created_at   │          │ theme        │
└──────────────┘          └──────────────┘

┌──────────────┐         ┌───────────────┐
│   students   │         │   subjects    │
├──────────────┤         ├───────────────┤
│ student_id(PK)│        │ id (PK)       │
│ name         │         │ subject_code  │
│ gender       │         │ subject_name  │
│ date_of_birth│         │ department    │
│ department   │         │ semester      │
│ course       │         │ faculty       │
│ semester     │         │ is_active     │
│ section      │         │ created_at    │
│ phone        │         └───────┬───────┘
│ email        │                 │
│ address      │                 │ 1:N
│ photo_path   │         ┌───────▼───────┐
│ face_encoding│         │  attendance   │
│ has_face_enc │         ├───────────────┤
│ is_active    │◄──1:N───│ id (PK)       │
│ created_at   │         │ student_id(FK)│
└──────────────┘         │ subject_id(FK)│
                         │ date          │
                         │ time          │
                         │ status        │
                         │ confidence    │
                         │ created_at    │
                         └───────────────┘
```

### 4.2 Cardinality
- One Student → Many Attendance records (1:N)
- One Subject → Many Attendance records (1:N)
- One Admin → All operations (1:N conceptually)

---

## 5. Interface Design

### 5.1 API Request/Response Format

**Login Request:**
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

**Login Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer"
}
```

**Recognize Face Response:**
```json
{
  "recognized": true,
  "student_id": "STU001",
  "student_name": "Rahul Kumar",
  "department": "Computer Science",
  "confidence": 92.45,
  "face_location": [100, 300, 300, 100]
}
```

---

## 6. Security Design

### 6.1 Authentication Architecture
```
                    ┌─────────────────────┐
Client ──login──►   │ /auth/login         │
                    │ verify bcrypt hash  │
                    │ create JWT token    │
Client ◄──token─    └─────────────────────┘

Client ──request──► ┌─────────────────────┐
 (Bearer token)     │ Dependency Injection │
                    │ get_current_admin() │
                    │ decode JWT          │
                    │ verify expiry       │
                    │ fetch admin from DB │
                    └─────────────────────┘
```

### 6.2 Data Flow Security
- All sensitive data (passwords) hashed before storage
- Face encodings stored as JSON strings in local SQLite (no cloud)
- JWT secret key configurable via environment variable
- CORS restricted to known frontend origins

---

## 7. Error Handling Design

| Layer | Error Type | Handling |
|-------|-----------|----------|
| Frontend | Network error | Toast notification + retry option |
| Frontend | 401 Unauthorized | Redirect to login |
| Frontend | 422 Validation | Show field-level error messages |
| Backend | Invalid JWT | Return 401 with detail message |
| Backend | Not found | Return 404 with detail |
| Backend | DB error | Return 500, log to console |
| Backend | Face not found | Return {recognized: false} |
| Camera | Permission denied | Show clear error message |
| Camera | No webcam | Show "No camera found" message |

---

*Document Version: 1.0 | Date: August 2025*
