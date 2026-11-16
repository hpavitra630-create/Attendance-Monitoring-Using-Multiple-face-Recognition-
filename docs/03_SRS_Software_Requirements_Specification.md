# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

**Project Title:** Attendance Monitoring System Using Face Recognition for Students  
**Document Version:** 1.0  
**Date:** August 2025  
**Standard:** IEEE 830-1998 SRS Format

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document describes the functional and non-functional requirements for the Attendance Monitoring System Using Face Recognition for Students. It is intended for developers, testers, project supervisors, and stakeholders.

### 1.2 Scope
The system, called **AttendanceMonitor**, is a web-based application that:
- Automates student attendance marking using face recognition
- Provides an admin dashboard for managing students, subjects, and records
- Generates attendance reports and exports
- Operates locally without internet dependency

The system does **not** include:
- Mobile application
- Multi-institution cloud deployment
- Student-facing portal
- SMS/Email notification system (in current scope)

### 1.3 Definitions and Abbreviations

| Term | Definition |
|------|-----------|
| Admin | System administrator / faculty member with login access |
| Face Encoding | 128-dimensional numerical vector representing facial features |
| JWT | JSON Web Token — stateless authentication mechanism |
| HOG | Histogram of Oriented Gradients — face detection algorithm |
| dlib | Machine learning toolkit used by face_recognition library |
| CRUD | Create, Read, Update, Delete operations |
| API | Application Programming Interface |
| REST | Representational State Transfer |
| SRS | Software Requirements Specification |

### 1.4 References
1. IEEE Standard 830-1998 — SRS Format
2. face_recognition library documentation: https://github.com/ageitgey/face_recognition
3. FastAPI documentation: https://fastapi.tiangolo.com
4. React documentation: https://react.dev

### 1.5 Overview
This document is organized as follows:
- **Section 2:** Overall description of the product
- **Section 3:** Specific functional requirements
- **Section 4:** Non-functional requirements
- **Section 5:** System constraints and assumptions

---

## 2. Overall Description

### 2.1 Product Perspective
AttendanceMonitor is a standalone desktop web application. It consists of:
- A React.js frontend (single-page application)
- A FastAPI Python backend (REST API server)
- An SQLite database for persistent storage
- A face recognition engine (dlib via face_recognition library)

```
[Browser] ←HTTP→ [FastAPI Server] ←ORM→ [SQLite DB]
                        ↕
              [face_recognition Engine]
                        ↕
                   [Webcam / Camera]
```

### 2.2 Product Functions
- Admin authentication (login/logout)
- Student registration and management
- Face sample capture and encoding
- Real-time face recognition via webcam
- Automatic attendance marking
- Attendance records browser with filters
- Subject management
- Report generation and export
- System configuration

### 2.3 User Classes and Characteristics

**Administrator / Faculty:**
- Has login credentials
- Manages students, subjects, and attendance
- Generates reports
- Technical competency: Basic (web browser user)
- Frequency: Daily

**Supervisor / HOD:**
- Views reports (no edit access in current scope)
- Technical competency: Basic

### 2.4 Operating Environment

**Client:**
- OS: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- Browser: Chrome 90+, Firefox 88+, Edge 90+
- Webcam: USB or built-in webcam (required for face features)

**Server (local):**
- OS: Windows 10+
- Python: 3.9 or higher
- Node.js: 18 or higher
- RAM: Minimum 4GB (8GB recommended)
- Disk: Minimum 2GB free space

### 2.5 Design and Implementation Constraints
- Face recognition library (dlib) requires C++ build tools on Windows
- SQLite is used for simplicity; not suitable for >1000 concurrent users
- Camera must be accessible from browser (HTTPS or localhost context)
- Face recognition accuracy decreases in poor lighting

### 2.6 Assumptions and Dependencies
- Assumes webcam is present and accessible
- Assumes Python 3.9+ with pip installed
- Assumes Node.js 18+ with npm installed
- Assumes Windows OS for primary deployment
- Assumes admin has basic computer literacy

---

## 3. Specific Requirements

### 3.1 Functional Requirements

---

#### FR-01: Admin Authentication

**FR-01.1 Login**
- **Description:** The system shall provide a login page with username and password fields.
- **Input:** Username (string), Password (string)
- **Processing:** Verify credentials against hashed password in database
- **Output:** JWT access token; redirect to dashboard
- **Error:** Display "Invalid username or password" for wrong credentials

**FR-01.2 Session Management**
- JWT token shall expire after 24 hours
- Token shall be stored in browser localStorage
- All protected routes shall validate token on each request

**FR-01.3 Logout**
- System shall provide a logout option in the sidebar
- Logout shall clear the token from localStorage and redirect to login

---

#### FR-02: Student Management

**FR-02.1 Register Student**
- Admin shall be able to register a student with:
  - Student ID (required, unique, max 20 chars)
  - Full Name (required, max 100 chars)
  - Gender (Male/Female/Other)
  - Date of Birth
  - Department (dropdown)
  - Course (dropdown)
  - Semester (1–8)
  - Section (A–D)
  - Phone Number
  - Email Address
  - Address
  - Photo (optional file upload)

**FR-02.2 List Students**
- System shall display a paginated list of all students (8 per page)
- List shall include: ID, photo, name, gender badge, department, course, semester, section, phone, email, actions
- Default sort: by student ID

**FR-02.3 Search and Filter**
- Admin shall be able to search by Student ID or Name
- Admin shall be able to filter by: Department, Course, Semester, Section
- Search shall be triggered by button click or Enter key

**FR-02.4 Edit Student**
- Admin shall be able to edit any student's details
- Edited data shall be validated before saving

**FR-02.5 Delete Student**
- Admin shall be able to delete a student with confirmation prompt
- Deletion shall also remove associated attendance records

**FR-02.6 Student Stats**
- Page shall display stat cards: Total Students, Male Students, Female Students, Departments

---

#### FR-03: Face Registration

**FR-03.1 Student Selection**
- Admin shall enter a Student ID to load the student for face registration

**FR-03.2 Webcam Device Selection**
- System shall enumerate all connected webcam devices
- Admin shall be able to select which webcam to use from a dropdown

**FR-03.3 Camera Control**
- System shall provide Start Camera and Stop Camera buttons
- Camera feed shall be displayed in a live preview area (minimum 640×480)

**FR-03.4 Sample Capture**
- Admin shall be able to capture face samples (button click)
- System shall capture exactly 10 samples (maximum)
- System shall show captured count (X/10) with colored squares indicator
- Admin shall be able to retake (clear all samples)

**FR-03.5 Encoding Generation**
- Admin shall be able to generate face encoding after capturing ≥ 3 samples
- System shall send all sample images to backend
- Backend shall compute average 128D face encoding
- Encoding shall be stored in the student's database record
- System shall display success message on completion

---

#### FR-04: Take Attendance

**FR-04.1 Subject Selection**
- If subjects exist, admin shall be able to select a subject for the session

**FR-04.2 Webcam Selection**
- System shall enumerate all connected webcams
- Admin shall be able to select the webcam device

**FR-04.3 Camera Control**
- Start Camera button: activates selected webcam and begins auto-scanning
- Stop Camera button: stops webcam and scanning
- Camera feed shall be shown in live preview (full width)

**FR-04.4 Automatic Recognition**
- System shall capture frames every 3 seconds while camera is active
- Frame shall be sent to backend for face recognition
- Backend shall compare against all stored face encodings
- If match found (confidence ≥ threshold): return student details

**FR-04.5 Recognition Display**
- On successful recognition, overlay student name + ID on camera feed
- Display recognition info panel: Student ID, Name, Department, Confidence %, Status, Date, Time

**FR-04.6 Attendance Marking**
- System shall automatically mark attendance as "Present" on recognition
- System shall check if attendance already marked today for same student
- System shall display appropriate success/already-marked message
- "Attendance Marked" text with checkmark shall appear

**FR-04.7 Duplicate Prevention**
- System shall not mark duplicate attendance for the same student on the same day

---

#### FR-05: Attendance Records

**FR-05.1 List Records**
- System shall display attendance records in a paginated table (10 per page)
- Columns: ID, Student ID, Name, Department, Subject, Date, Time, Status

**FR-05.2 Status Display**
- "Present" shall display in green colored text
- "Absent" shall display in red colored text

**FR-05.3 Filter Records**
- Admin shall be able to filter by: Date From, Date To, Department, Status
- Filters shall be applied on Search button click

**FR-05.4 Select Records**
- Each row shall have a checkbox for selection
- "Select All" checkbox in header
- Selected count shall be shown on Delete button

**FR-05.5 Export Records**
- Admin shall be able to export records to CSV
- Admin shall be able to export records to Excel (.xlsx)
- Exported file shall download automatically

**FR-05.6 Delete Records**
- Admin shall be able to delete selected records
- Confirmation dialog shall appear before deletion
- Refresh button shall reload records from server

---

#### FR-06: Subject Management

**FR-06.1 List Subjects**
- System shall display all subjects in a paginated table
- Columns: #, Subject Code, Subject Name, Department, Semester, Faculty, Status, Action

**FR-06.2 Subject Stats**
- Stat cards: Total Subjects, Departments, Active Subjects, Inactive Subjects

**FR-06.3 Add Subject**
- Admin shall be able to add a subject via modal dialog
- Required fields: Subject Code, Subject Name
- Optional: Department, Semester, Faculty, Active toggle

**FR-06.4 Edit/Delete Subject**
- Admin shall be able to edit or delete any subject

**FR-06.5 Status Badge**
- Active subjects: green "Active" badge
- Inactive subjects: red "Inactive" badge

---

#### FR-07: Dashboard

**FR-07.1 Statistics**
- Dashboard shall display 4 stat cards:
  - Total Students (blue)
  - Present Today (green)
  - Absent Today (red)
  - Attendance Percentage for Today (purple)
- Stat cards shall be clickable and navigate to relevant pages

**FR-07.2 Recent Attendance**
- Dashboard shall show the last 8 attendance records in a table
- Columns: Student ID, Name, Department, Time, Status

**FR-07.3 Quick Actions**
- 4 colored buttons: Register Student, Capture Face, Take Attendance, Generate Report
- Each navigates to the relevant page

**FR-07.4 Date Display**
- Dashboard shall show today's date and day name

---

#### FR-08: Reports

**FR-08.1 Report Types**
- System shall support: Daily Report, Monthly Report, Student Report, Subject Report

**FR-08.2 Date Selection**
- Admin shall select a date for report generation

**FR-08.3 Generate Report**
- Click Generate button → fetch data for selected type and date
- Display 4 stat cards: Total Students, Present, Absent, Attendance %

**FR-08.4 Chart**
- Display a pie chart showing Present vs Absent split
- Each segment labeled with percentage
- Legend showing student counts

---

#### FR-09: Settings

**FR-09.1 Application Settings**
- Admin shall be able to configure:
  - Application Name
  - Recognition Threshold (50%–90%)
  - Camera Index (0–3)
  - Camera Resolution (640×480, 1280×720, 1920×1080)
  - Theme (Dark/Light)
- Save Settings button shall persist changes

**FR-09.2 Database Backup**
- Admin shall be able to create a database backup with one click
- Last backup timestamp shall be displayed

**FR-09.3 Database Restore**
- Admin shall be able to upload a backup file
- Click Restore to restore the database

---

### 3.2 External Interface Requirements

#### 3.2.1 User Interfaces
- Web browser interface (Chrome/Firefox/Edge)
- Minimum screen resolution: 1280×768
- Responsive at 1280px and above
- Navigation: persistent left sidebar
- Language: English

#### 3.2.2 Hardware Interfaces
- Webcam (USB or built-in, minimum 640×480)
- Keyboard and mouse
- Display (1280×768 minimum)

#### 3.2.3 Software Interfaces
- React.js frontend communicates with FastAPI backend via HTTP REST APIs
- FastAPI uses SQLAlchemy to interface with SQLite database
- face_recognition library interfaces with dlib and OpenCV
- Browser's `navigator.mediaDevices.getUserMedia()` API for webcam

#### 3.2.4 Communication Interfaces
- HTTP/HTTPS on localhost
- JSON data format for all API communication
- JWT Bearer token in Authorization header

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-P01:** Dashboard page shall load within 2 seconds
- **NFR-P02:** Face recognition shall complete within 3 seconds per frame
- **NFR-P03:** API responses shall be returned within 500ms for database queries
- **NFR-P04:** System shall handle up to 500 students without performance degradation

### 4.2 Security
- **NFR-S01:** Passwords shall be hashed using bcrypt (cost factor 12)
- **NFR-S02:** All API endpoints except login shall require valid JWT token
- **NFR-S03:** JWT tokens shall expire after 24 hours
- **NFR-S04:** Face encodings shall be stored locally, not sent to external services

### 4.3 Reliability
- **NFR-R01:** System shall use SQLite transactions to prevent data corruption
- **NFR-R02:** Database shall persist across server restarts
- **NFR-R03:** System shall handle camera disconnection gracefully with error message

### 4.4 Usability
- **NFR-U01:** User interface shall be operable with minimal training
- **NFR-U02:** Error messages shall be clear and actionable
- **NFR-U03:** All interactive elements shall provide visual feedback
- **NFR-U04:** Loading states shall be shown for all async operations

### 4.5 Maintainability
- **NFR-M01:** Code shall follow modular structure (separate routers, models, schemas)
- **NFR-M02:** Database schema changes shall be manageable via SQLAlchemy
- **NFR-M03:** Configuration shall be stored in settings table, not hardcoded

### 4.6 Portability
- **NFR-Po01:** System shall run on Windows 10+, macOS, and Ubuntu
- **NFR-Po02:** Frontend shall work on Chrome, Firefox, and Edge

---

## 5. System Constraints

1. Requires Python 3.9+ environment with C++ build tools for dlib
2. Requires Node.js 18+ for frontend development
3. Camera access requires browser permission approval
4. Face recognition accuracy depends on lighting conditions
5. SQLite is single-writer; concurrent writes may cause conflicts (not applicable in single-admin setup)
6. Face encoding generation requires clear frontal face in frame

---

*Document Version: 1.0 | Standard: IEEE 830-1998 | Date: August 2025*
