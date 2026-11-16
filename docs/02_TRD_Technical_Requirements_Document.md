# TECHNICAL REQUIREMENTS DOCUMENT (TRD)

**Project Title:** Attendance Monitoring System Using Face Recognition for Students  
**Version:** 1.0  
**Date:** August 2025  
**Type:** Internal Technical Reference

---

## 1. Technology Stack

### 1.1 Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| UI Framework | React.js | 18.x | Component-based UI |
| Build Tool | Vite | 5.x | Fast dev server & bundler |
| Routing | React Router DOM | 6.x | Client-side navigation |
| HTTP Client | Axios | 1.x | API communication |
| Charts | Recharts | 2.x | Pie/bar charts for reports |
| Icons | Lucide React | 0.x | SVG icon library |
| Notifications | React Hot Toast | 2.x | Toast notifications |
| Styling | Vanilla CSS | — | Custom design system |
| Font | Inter (Google Fonts) | — | Typography |

### 1.2 Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Web Framework | FastAPI | 0.115.x | REST API server |
| ASGI Server | Uvicorn | 0.x | Production server |
| ORM | SQLAlchemy | 2.x | Database abstraction |
| Database | SQLite | 3.x | Local persistent storage |
| Auth | JWT (python-jose) | 3.x | Token-based auth |
| Password Hash | Passlib (bcrypt) | 1.x | Secure password storage |
| Face Recognition | face_recognition | 1.3.x | dlib-based face encoding |
| Image Processing | OpenCV (cv2) | 4.x | Camera & image ops |
| Array Processing | NumPy | 1.x | Face encoding arrays |
| Image Handling | Pillow | 10.x | Image load/save |
| CORS | FastAPI CORS Middleware | — | Cross-origin requests |

### 1.3 Development Tools

| Tool | Purpose |
|------|---------|
| Node.js 18+ | Frontend runtime |
| Python 3.9+ | Backend runtime |
| npm | Frontend package manager |
| pip | Python package manager |
| Git | Version control |
| VS Code | Development IDE |

---

## 2. System Architecture

### 2.1 High-Level Architecture
```
┌─────────────────────────────────────────────┐
│                  CLIENT LAYER                │
│   Browser (React + Vite @ localhost:5173)    │
│   ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│   │Dashboard │ │ Students │ │ Attendance │  │
│   └──────────┘ └──────────┘ └────────────┘  │
└─────────────────────┬───────────────────────┘
                      │ HTTP/REST (Axios)
                      │ JSON
┌─────────────────────▼───────────────────────┐
│                  API LAYER                   │
│   FastAPI Server @ localhost:8000            │
│   ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│   │  Auth    │ │ Students │ │   Face     │  │
│   │  Routes  │ │  Routes  │ │  Routes    │  │
│   └──────────┘ └──────────┘ └────────────┘  │
│   ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│   │Attendance│ │ Subjects │ │  Reports   │  │
│   │  Routes  │ │  Routes  │ │  Routes    │  │
│   └──────────┘ └──────────┘ └────────────┘  │
└─────────────────────┬───────────────────────┘
                      │ SQLAlchemy ORM
┌─────────────────────▼───────────────────────┐
│                  DATA LAYER                  │
│   SQLite Database (attendance.db)            │
│   ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│   │  admins  │ │ students │ │ attendance │  │
│   └──────────┘ └──────────┘ └────────────┘  │
│   ┌──────────┐ ┌──────────┐                 │
│   │ subjects │ │ settings │                 │
│   └──────────┘ └──────────┘                 │
└─────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│             FACE RECOGNITION ENGINE          │
│   face_recognition library (dlib)           │
│   ┌──────────────┐ ┌───────────────────┐    │
│   │Face Detection│ │Face Encoding (128D)│    │
│   └──────────────┘ └───────────────────┘    │
│   ┌──────────────────────────────────────┐  │
│   │  Euclidean Distance Comparison       │  │
│   └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
frontend/src/
├── App.jsx                   # Root router
├── main.jsx                  # Entry point
├── index.css                 # Global design system
├── components/
│   └── Sidebar.jsx           # Navigation sidebar
├── context/
│   └── AuthContext.jsx       # Auth state management
├── hooks/
│   └── useAuth.js            # Auth hook
├── layouts/
│   └── MainLayout.jsx        # App shell
├── pages/
│   ├── Login.jsx             # Authentication
│   ├── Dashboard.jsx         # Stats overview
│   ├── Students.jsx          # Student management
│   ├── StudentRegister.jsx   # Student add/edit
│   ├── FaceRegistration.jsx  # Face capture
│   ├── TakeAttendance.jsx    # Live recognition
│   ├── AttendanceRecords.jsx # Records browser
│   ├── Subjects.jsx          # Subject management
│   ├── Reports.jsx           # Report generation
│   └── Settings.jsx          # System config
└── services/
    └── api.js                # Axios instance

backend/app/
├── main.py                   # FastAPI app + startup
├── database.py               # SQLAlchemy session
├── models/                   # Database models
│   ├── admin.py
│   ├── student.py
│   ├── subject.py
│   ├── attendance.py
│   └── settings.py
├── routers/                  # API route handlers
│   ├── auth.py
│   ├── students.py
│   ├── subjects.py
│   ├── attendance.py
│   ├── face_recognition.py
│   ├── reports.py
│   ├── dashboard.py
│   └── settings.py
├── authentication/
│   └── auth.py               # JWT + bcrypt
├── schemas/                  # Pydantic validators
└── utils/
    ├── seed_data.py          # DB initialization
    └── face_utils.py         # Recognition helpers
```

---

## 3. Database Design

### 3.1 Tables

#### `admins`
```sql
CREATE TABLE admins (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `students`
```sql
CREATE TABLE students (
    student_id   VARCHAR(20) PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    gender       VARCHAR(10),
    date_of_birth VARCHAR(20),
    department   VARCHAR(100),
    course       VARCHAR(50),
    semester     VARCHAR(5),
    section      VARCHAR(5),
    phone        VARCHAR(15),
    email        VARCHAR(100),
    address      TEXT,
    photo_path   VARCHAR(255),
    face_encoding TEXT,              -- JSON array of 128D vector
    has_face_encoding BOOLEAN DEFAULT FALSE,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `subjects`
```sql
CREATE TABLE subjects (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    department   VARCHAR(100),
    semester     VARCHAR(5),
    faculty      VARCHAR(100),
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `attendance`
```sql
CREATE TABLE attendance (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id VARCHAR(20) REFERENCES students(student_id),
    subject_id INTEGER REFERENCES subjects(id),
    date       VARCHAR(20) NOT NULL,
    time       VARCHAR(20),
    status     VARCHAR(20) DEFAULT 'Present',
    confidence FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `app_settings`
```sql
CREATE TABLE app_settings (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name              VARCHAR(100),
    recognition_threshold FLOAT DEFAULT 0.70,
    camera_index          INTEGER DEFAULT 0,
    camera_resolution     VARCHAR(20) DEFAULT '640x480',
    theme                 VARCHAR(20) DEFAULT 'dark'
);
```

---

## 4. API Endpoints

### 4.1 Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login, get JWT token |
| GET | `/api/auth/me` | Yes | Get current user |

### 4.2 Students
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/students` | Yes | List students (paginated) |
| POST | `/api/students` | Yes | Create student |
| GET | `/api/students/{id}` | Yes | Get student by ID |
| PUT | `/api/students/{id}` | Yes | Update student |
| DELETE | `/api/students/{id}` | Yes | Delete student |

### 4.3 Face Recognition
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/face/register` | Yes | Register face (10 images) |
| POST | `/api/face/recognize` | Yes | Recognize face from frame |

### 4.4 Attendance
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/attendance` | Yes | List records (paginated) |
| POST | `/api/attendance/mark` | Yes | Mark attendance |
| DELETE | `/api/attendance/{id}` | Yes | Delete record |

### 4.5 Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/stats` | Yes | Today's summary stats |
| GET | `/api/dashboard/recent-attendance` | Yes | Recent 10 records |

### 4.6 Subjects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/subjects` | Yes | List subjects |
| POST | `/api/subjects` | Yes | Create subject |
| PUT | `/api/subjects/{id}` | Yes | Update subject |
| DELETE | `/api/subjects/{id}` | Yes | Delete subject |

### 4.7 Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reports/generate` | Yes | Generate report |
| GET | `/api/reports/export/csv` | Yes | Export CSV |
| GET | `/api/reports/export/excel` | Yes | Export Excel |

### 4.8 Settings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | Yes | Get settings |
| PUT | `/api/settings` | Yes | Update settings |
| POST | `/api/settings/backup` | Yes | Backup database |
| POST | `/api/settings/restore` | Yes | Restore database |

---

## 5. Security Architecture

### 5.1 Authentication Flow
```
1. Admin submits username + password
2. Server verifies against hashed password (bcrypt)
3. Server issues JWT token (expires: 24 hours)
4. Client stores token in localStorage
5. Client sends token in Authorization: Bearer <token> header
6. Server validates token on every protected request
7. Expired/invalid tokens return 401 Unauthorized
```

### 5.2 Password Security
- Algorithm: bcrypt with salt factor 12
- Storage: Only hash stored, never plaintext
- Validation: `passlib[bcrypt]` library

### 5.3 CORS Configuration
```python
origins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]
methods = ["GET", "POST", "PUT", "DELETE"]
headers = ["*"]
```

---

## 6. Face Recognition Algorithm

### 6.1 Registration
```
1. Capture 10 images from webcam
2. Detect face in each image using HOG face detector
3. Compute 128-dimensional face encoding per image
4. Average all 10 encodings → master encoding vector
5. Serialize encoding as JSON string
6. Store in student.face_encoding column
```

### 6.2 Recognition
```
1. Capture frame from webcam
2. Detect face in frame (HOG detector)
3. Compute 128D encoding for detected face
4. Load all stored encodings from database
5. Compute Euclidean distance: d = ||enc_frame - enc_stored||
6. Threshold: if d < (1 - threshold), face matches
7. Best match = minimum distance student
8. Return match if confidence >= threshold (default 70%)
```

### 6.3 Confidence Score
```
confidence = (1 - euclidean_distance) × 100
```

---

## 7. Performance Requirements

| Metric | Target | Measured |
|--------|--------|---------|
| Page load time | < 2 seconds | ~1.5s |
| Face recognition | < 3 seconds | ~2s |
| API response | < 500ms | ~200ms |
| Build size (JS) | < 1MB | 688 KB |
| Database queries | < 100ms | ~50ms |

---

## 8. Development Environment Setup

### 8.1 Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 8.2 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 8.3 Environment Variables
```env
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite:///./database/attendance.db
```

---

## 9. Deployment Architecture

```
Production (Local):
├── Backend:  http://localhost:8000  (uvicorn --workers 4)
├── Frontend: http://localhost:5173  (vite preview / nginx)
└── Database: /backend/database/attendance.db
```

---

*Document Version: 1.0 | Status: Final | Date: August 2025*
