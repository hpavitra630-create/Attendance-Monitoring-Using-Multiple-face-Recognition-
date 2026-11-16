# Attendance Monitoring Using Face Recognition for Students

A complete, production-quality full-stack application for automated student attendance management using face recognition technology.

---

## 🚀 Features

- **Admin Authentication** — Secure JWT-based login
- **Student Management** — Full CRUD with photo upload
- **Face Registration** — Capture 10 face samples per student via browser webcam
- **Face Encoding** — Generate and store face encodings using the `face_recognition` library
- **Attendance Recognition** — Real-time face recognition with configurable confidence threshold
- **Duplicate Prevention** — One attendance per student per subject per day (enforced at DB + API level)
- **Dashboard** — Live statistics: Total Students, Present, Absent, Attendance %
- **Attendance Records** — Filterable table with CSV and Excel export
- **Reports** — Daily, Monthly, and Student-specific reports with pie charts
- **Subject Management** — Add, edit, delete subjects
- **Settings** — Recognition threshold, camera configuration, app preferences
- **Database Backup & Restore** — Timestamped SQLite backups
- **Print Support** — Browser-friendly print layout for reports

---

## 🏗 Architecture

```
Frontend (React + Vite)          Backend (Python + FastAPI)
        │                                  │
   React Router                      FastAPI Routers
   Axios HTTP Client  ──── REST ────> Auth / Students / Face / Attendance
   Recharts                           │         │          │
   Lucide Icons                   SQLAlchemy  OpenCV   face_recognition
                                   SQLite DB   numpy     Pickle encodings
```

---

## 📁 Project Structure

```
attendance-monitoring-system/
├── frontend/
│   ├── src/
│   │   ├── components/        # Sidebar
│   │   ├── layouts/           # MainLayout
│   │   ├── pages/             # All page components
│   │   ├── services/          # Axios API client
│   │   ├── hooks/             # useAuth context
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entry point
│   │   ├── config.py                  # Settings
│   │   ├── database.py                # SQLAlchemy setup
│   │   ├── models/                    # SQLAlchemy models
│   │   ├── schemas/                   # Pydantic schemas
│   │   ├── routers/                   # API routes
│   │   ├── services/                  # Business logic
│   │   ├── face_recognition_service/  # Face AI services
│   │   ├── authentication/            # JWT auth
│   │   └── utils/                     # Seed data
│   ├── tests/
│   │   └── test_api.py
│   └── requirements.txt
│
├── database/              # SQLite database file
├── uploads/               # Student photos + face samples
├── face_encodings/        # Stored face encodings (.pkl)
├── backups/               # Database backups
├── reports/               # Generated report files
└── .env.example
```

---

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Backend Framework | FastAPI |
| ASGI Server | Uvicorn |
| ORM | SQLAlchemy |
| Database | SQLite (upgradeable to PostgreSQL) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Face Recognition | face_recognition + OpenCV + dlib |
| Spreadsheets | Pandas + OpenPyXL |
| Validation | Pydantic v2 |

---

## ⚙️ Installation

### Prerequisites

- Python 3.9+
- Node.js 18+
- CMake (required for `dlib` / `face_recognition`)
- Visual Studio Build Tools on Windows (for dlib compilation)

---

### 1. Clone / Open Project

```bash
# Navigate to the project root
cd "Attendance Monitoring using Face Recognition for Students"
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install core dependencies (fast install, no face_recognition)
pip install fastapi uvicorn[standard] sqlalchemy pydantic pydantic-settings \
    python-jose[cryptography] passlib[bcrypt] python-multipart \
    numpy Pillow pandas openpyxl python-dotenv aiofiles
```

#### Installing face_recognition (Optional but required for real recognition)

The `face_recognition` library requires `dlib` which requires CMake and C++ build tools.

**Windows:**
```bash
# Install CMake from https://cmake.org/download/
# Install Visual Studio Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/
pip install cmake
pip install dlib
pip install face-recognition
```

**Linux/macOS:**
```bash
sudo apt-get install cmake build-essential libopenblas-dev liblapack-dev
pip install dlib face-recognition
```

> **Note:** The system works without `face_recognition` installed. Face detection and recognition features will be disabled, but all other features (student management, manual attendance, reports, etc.) will work fully.

---

### 3. Environment Configuration

```bash
# Copy example env
cp ../.env.example .env

# Edit as needed (defaults work for local development)
```

Key settings in `.env`:
```
SECRET_KEY=your-super-secret-key
FACE_RECOGNITION_THRESHOLD=0.70
DATABASE_URL=sqlite:///./database/attendance.db
```

---

### 4. Run the Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

The API will be available at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs**

---

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

## 🔐 Default Credentials

| Username | Password |
|----------|----------|
| `admin`  | `admin123` |

> **Important:** Change this password in production!

---

## 👤 How to Register Students

1. Login to the system
2. Click **Students** → **Register Student**
3. Fill in the student form (Student ID, Name, Department, Course, etc.)
4. Optionally upload a photo
5. Click **Save**

---

## 📷 How to Capture Face Samples

1. Go to **Face Registration**
2. Enter or select a Student ID
3. Click **Start Camera**
4. Click **Capture Sample** 5–10 times (different angles, expressions)
5. Click **Generate Encoding**
6. Look for the success message: "Face Encoding Generated Successfully!"

---

## ✅ How to Take Attendance

1. Go to **Take Attendance**
2. Select a Subject from the dropdown
3. Click **Start Camera**
4. Either:
   - Click **Scan Face** to recognize manually
   - Or click **Auto Mode** for automatic scanning every 3 seconds
5. The recognized student's information and attendance status appear in the Recognition Info panel

---

## 📊 How to Export Reports

1. Go to **Attendance Records**
2. Apply any filters (date range, department, status)
3. Click **Export Excel** or **Export CSV**
4. The file downloads automatically

---

## 💾 How to Backup Database

1. Go to **Settings**
2. Click **Backup Now** in the Database Backup section
3. A timestamped backup is created in the `backups/` directory

---

## 🔄 How to Restore Database

1. Go to **Settings**
2. In the **Database Restore** section, select a backup from the dropdown
3. Click **Restore Database**
4. Confirm the operation

---

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
python -m pytest tests/ -v
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/students` | List all students |
| POST | `/api/students` | Register new student |
| PUT | `/api/students/{id}` | Update student |
| DELETE | `/api/students/{id}` | Delete student |
| POST | `/api/face/register` | Upload face sample |
| POST | `/api/face/encode` | Generate face encoding |
| POST | `/api/face/recognize` | Recognize face |
| POST | `/api/attendance/mark` | Mark attendance |
| GET | `/api/attendance` | Get attendance records |
| GET | `/api/attendance/today` | Get today's stats |
| GET | `/api/subjects` | List subjects |
| POST | `/api/subjects` | Create subject |
| GET | `/api/reports/daily` | Daily report |
| GET | `/api/reports/monthly` | Monthly report |
| GET | `/api/reports/student/{id}` | Student report |
| GET | `/api/reports/export/csv` | Export CSV |
| GET | `/api/reports/export/excel` | Export Excel |
| GET | `/api/settings` | Get app settings |
| PUT | `/api/settings` | Update settings |
| POST | `/api/settings/backup` | Create DB backup |
| POST | `/api/settings/restore` | Restore DB |
| GET | `/api/dashboard/stats` | Dashboard statistics |

---

## 🛠 Troubleshooting

### Camera not working
- Ensure browser has camera permissions
- Try different camera index in Settings (0, 1, 2)
- Use HTTPS in production for camera access

### face_recognition installation fails on Windows
- Install Visual Studio Build Tools with C++ workload
- Install CMake first: `pip install cmake`
- Try: `pip install dlib --verbose`

### Backend fails to start
- Check Python version: `python --version` (needs 3.9+)
- Activate virtual environment before running
- Ensure `.env` file exists in `backend/` directory

### Database issues
- Delete `database/attendance.db` to reset (data will be lost)
- Restart the backend to re-seed sample data

### CORS errors
- Ensure backend is running on `http://localhost:8000`
- Frontend Vite dev server proxies API requests automatically
- Check `CORS_ORIGINS` in `.env` matches your frontend URL

---

## 🔒 Security Notes

- Admin passwords are hashed with bcrypt
- JWT tokens expire after 8 hours
- Face encodings are stored server-side only
- File uploads are validated for type and size
- SQL injection protection via SQLAlchemy ORM

---

## 📝 License

Educational use. For production deployment, review and harden security settings.
