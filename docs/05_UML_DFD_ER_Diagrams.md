# UML DIAGRAMS + DFD + ER DIAGRAMS

**Project:** Attendance Monitoring System Using Face Recognition for Students  
**Version:** 1.0 | **Date:** August 2025

> **Note:** All diagrams below are expressed in structured text/ASCII notation. Render them using PlantUML, draw.io, Lucidchart, or include them in Word as described.

---

## PART A: UML DIAGRAMS

---

## A.1 Use Case Diagram

```
                    ┌──────────────────────────────────────────────────┐
                    │         Attendance Monitoring System              │
                    │                                                    │
                    │  ┌──────────────────────────────────────────┐     │
                    │  │            <<Admin Actor>>                │     │
                    │  │                                            │     │
           ┌────────┤  │  ○ Login to System                        │     │
           │ Admin  ├─►│  ○ Manage Students (CRUD)                 │     │
           │(Faculty│  │  ○ Register Student Face                   │     │
           │  )     │  │  ○ Select Webcam Device                   │     │
           └────────┤  │  ○ Take Attendance (Auto-recognition)     │     │
                    │  │  ○ View Attendance Records                 │     │
                    │  │  ○ Filter/Search Records                   │     │
                    │  │  ○ Export Attendance (CSV/Excel)           │     │
                    │  │  ○ Manage Subjects                         │     │
                    │  │  ○ Generate Reports                        │     │
                    │  │  ○ Configure System Settings               │     │
                    │  │  ○ Backup/Restore Database                 │     │
                    │  │  ○ Logout                                  │     │
                    │  └──────────────────────────────────────────┘     │
                    │                                                    │
                    │  ┌──────────────┐                                 │
                    │  │<<System>>    │                                  │
                    │  │Face Recog.   │                                  │
                    │  │Engine        │                                  │
                    │  └──────────────┘                                 │
                    └──────────────────────────────────────────────────┘
```

**PlantUML Code:**
```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor Admin
rectangle "Attendance Monitoring System" {
  usecase "Login" as UC1
  usecase "Manage Students" as UC2
  usecase "Register Face" as UC3
  usecase "Select Webcam" as UC4
  usecase "Take Attendance" as UC5
  usecase "View Records" as UC6
  usecase "Export Records" as UC7
  usecase "Manage Subjects" as UC8
  usecase "Generate Reports" as UC9
  usecase "Settings" as UC10
  usecase "Backup/Restore" as UC11
  usecase "Logout" as UC12

  UC3 ..> UC4 : <<include>>
  UC5 ..> UC4 : <<include>>
  UC5 ..> UC3 : <<extend>>
}

Admin --> UC1
Admin --> UC2
Admin --> UC3
Admin --> UC5
Admin --> UC6
Admin --> UC7
Admin --> UC8
Admin --> UC9
Admin --> UC10
Admin --> UC11
Admin --> UC12
@enduml
```

---

## A.2 Class Diagram

```plantuml
@startuml
class Admin {
  +id: int
  +username: str
  +hashed_password: str
  +full_name: str
  +is_active: bool
  +created_at: datetime
  --
  +login(username, password): Token
  +logout(): void
}

class Student {
  +student_id: str
  +name: str
  +gender: str
  +date_of_birth: str
  +department: str
  +course: str
  +semester: str
  +section: str
  +phone: str
  +email: str
  +address: str
  +photo_path: str
  +face_encoding: str
  +has_face_encoding: bool
  +is_active: bool
  --
  +register(): Student
  +update(): Student
  +delete(): void
  +getFaceEncoding(): float[]
}

class Subject {
  +id: int
  +subject_code: str
  +subject_name: str
  +department: str
  +semester: str
  +faculty: str
  +is_active: bool
  --
  +create(): Subject
  +update(): Subject
  +delete(): void
}

class Attendance {
  +id: int
  +student_id: str
  +subject_id: int
  +date: str
  +time: str
  +status: str
  +confidence: float
  +created_at: datetime
  --
  +markPresent(): Attendance
  +delete(): void
  +exportCSV(): file
  +exportExcel(): file
}

class FaceRecognitionEngine {
  +encodings: dict
  +threshold: float
  --
  +loadEncodings(db): dict
  +registerFace(images): float[]
  +recognize(frame): RecognitionResult
  +computeEncoding(image): float[]
  +compareEncodings(enc1, enc2): float
}

class AppSettings {
  +id: int
  +app_name: str
  +recognition_threshold: float
  +camera_index: int
  +camera_resolution: str
  +theme: str
  --
  +getSettings(): AppSettings
  +updateSettings(): void
  +backup(): file
  +restore(file): void
}

Admin "1" --> "many" Attendance : marks
Student "1" --> "many" Attendance : has
Subject "1" --> "many" Attendance : for
FaceRecognitionEngine --> Student : reads encodings
FaceRecognitionEngine --> Attendance : creates
Admin --> AppSettings : configures
@enduml
```

---

## A.3 Sequence Diagram — Login

```plantuml
@startuml
title Login Sequence

actor Admin
participant "Browser\n(React)" as Browser
participant "FastAPI\nServer" as Server
participant "SQLite\nDB" as DB

Admin -> Browser: Enter username + password
Browser -> Server: POST /api/auth/login\n{username, password}
Server -> DB: SELECT * FROM admins WHERE username=?
DB --> Server: admin row
Server -> Server: verify_password(password, hash)
alt Password correct
  Server -> Server: create_access_token(admin_id)
  Server --> Browser: {access_token: "eyJ..."}
  Browser -> Browser: store token in localStorage
  Browser --> Admin: Redirect to Dashboard
else Password wrong
  Server --> Browser: 401 {detail: "Incorrect credentials"}
  Browser --> Admin: Show error message
end
@enduml
```

---

## A.4 Sequence Diagram — Face Recognition & Attendance Marking

```plantuml
@startuml
title Face Recognition & Attendance Marking

actor Admin
participant "Browser" as B
participant "Webcam" as W
participant "FastAPI" as API
participant "FaceEngine" as FE
participant "SQLite" as DB

Admin -> B: Click "Start Camera"
B -> W: getUserMedia({video: true})
W --> B: Video stream

loop Every 3 seconds
  B -> B: capture frame (canvas.toBlob)
  B -> API: POST /api/face/recognize\n(image blob, subject_id)
  API -> DB: Load all face encodings
  DB --> API: {student_id: encoding}[]
  API -> FE: recognize(frame, encodings)
  FE -> FE: detect face in frame
  FE -> FE: compute 128D encoding
  FE -> FE: compare with all stored encodings
  alt Face matched (confidence >= threshold)
    FE --> API: {student_id, confidence}
    API -> DB: Check today's attendance\n(student_id, date)
    alt Not yet marked today
      API -> DB: INSERT attendance record
      DB --> API: attendance saved
      API --> B: {recognized: true, student_name, confidence}
      B --> Admin: Show name overlay on camera\nShow "Attendance Marked" ✓
    else Already marked
      API --> B: {already_marked: true}
      B --> Admin: Show "Already marked today"
    end
  else No match
    FE --> API: {recognized: false}
    API --> B: {recognized: false}
  end
end

Admin -> B: Click "Stop Camera"
B -> W: stop all tracks
@enduml
```

---

## A.5 Sequence Diagram — Face Registration

```plantuml
@startuml
title Face Registration

actor Admin
participant "Browser" as B
participant "Webcam" as W
participant "FastAPI" as API
participant "DB" as DB

Admin -> B: Enter student ID, click "Load Student"
B -> API: GET /api/students/{id}
API -> DB: SELECT student
DB --> API: student data
API --> B: student info
B --> Admin: Show student details

Admin -> B: Click "Start Camera"
B -> W: getUserMedia({video})
W --> B: Video stream
B --> Admin: Live camera feed shown

loop 10 times
  Admin -> B: Click "Capture Sample"
  B -> B: canvas.toDataURL() → capture image
  B --> Admin: Sample counter updates (1/10 → 10/10)
end

Admin -> B: Click "Generate Encoding"
B -> B: Convert 10 DataURLs → Blobs
B -> API: POST /api/face/register\n(student_id, images[10])
API -> API: For each image:\n  detect_face()\n  compute_encoding()
API -> API: Average all encodings\n→ master_encoding[128]
API -> DB: UPDATE students SET\n  face_encoding = JSON(master_encoding)\n  has_face_encoding = TRUE
DB --> API: saved
API --> B: {success: true, message}
B --> Admin: "Face Encoding Generated Successfully!" ✓
@enduml
```

---

## A.6 Activity Diagram — Take Attendance

```
START
  │
  ▼
Open Take Attendance Page
  │
  ▼
Select Webcam Device (from dropdown)
  │
  ▼
Select Subject (optional)
  │
  ▼
Click "Start Camera"
  │
  ▼
Camera Activated? ──No──► Show Error Message ──► STOP
  │
  Yes
  │
  ▼
┌────────────────────┐
│  Auto-scan loop    │◄─────────────────────────┐
│  (every 3 seconds) │                          │
└────────┬───────────┘                          │
         │                                      │
         ▼                                      │
    Capture Frame                               │
         │                                      │
         ▼                                      │
    Send to API                                 │
         │                                      │
         ▼                                      │
    Face Detected? ──No──► Mark unrecognized ───┤
         │                                      │
        Yes                                     │
         │                                      │
         ▼                                      │
    Confidence >= Threshold? ──No──────────────►│
         │                                      │
        Yes                                     │
         │                                      │
         ▼                                      │
    Already marked today? ──Yes──► Show msg ───►│
         │                                      │
        No                                      │
         │                                      │
         ▼                                      │
    Mark Attendance in DB                       │
         │                                      │
         ▼                                      │
    Show "Attendance Marked" ───────────────────┘
         │
         ▼
    Admin clicks "Stop Camera"
         │
         ▼
    Camera Stopped
         │
         ▼
         END
```

---

## A.7 State Diagram — Attendance Session

```plantuml
@startuml
[*] --> Idle : page loaded
Idle --> CameraStarting : click "Start Camera"
CameraStarting --> CameraActive : permission granted
CameraStarting --> Error : permission denied
CameraActive --> Scanning : every 3 seconds
Scanning --> Recognizing : frame captured
Recognizing --> Recognized : face matched
Recognizing --> NotRecognized : no match
Recognized --> MarkedAttendance : not duplicate
Recognized --> AlreadyMarked : duplicate today
MarkedAttendance --> Scanning : continue loop
AlreadyMarked --> Scanning : continue loop
NotRecognized --> Scanning : continue loop
CameraActive --> Idle : click "Stop Camera"
Error --> Idle : user dismisses error
[*] --> Idle
@enduml
```

---

## PART B: DATA FLOW DIAGRAMS (DFD)

---

## B.1 Level 0 DFD (Context Diagram)

```
                   ┌─────────────────────────────────────┐
                   │                                       │
  Admin ──────────►│   Attendance Monitoring System        │◄──── Webcam
                   │                                       │
  Admin ◄──────────│   (all input/output flows)            │────► Database
                   │                                       │
                   └─────────────────────────────────────┘
```

**External Entities:** Admin (User), Webcam (Hardware)  
**System:** Attendance Monitoring System  
**Data Flows:**
- Admin → System: Login credentials, student data, face images, attendance commands
- System → Admin: Dashboards, recognition results, reports, exports
- Webcam → System: Video frames
- System → Database: Read/Write all persistent data

---

## B.2 Level 1 DFD

```
Admin ──login──► [1.0 Authentication] ──token──► all processes
                        │
                        ▼
                  [Admin DB: admins]

Admin ──student data──► [2.0 Student Management] ──CRUD──► [Student DB]
Admin ◄── student list──

Admin ──images──► [3.0 Face Registration] ──encodings──► [Student DB]
                        │
                        ▼
                 [Face Engine: dlib]

Webcam ──frames──► [4.0 Face Recognition] ──read encodings──► [Student DB]
Admin ◄── result──      │
                        │──mark attendance──► [5.0 Attendance Management]
                                                      │
                                                      ▼
                                              [Attendance DB]

Admin ──filters──► [5.0 Attendance Management] ──records──► Admin
Admin ──export──► [5.0] ──CSV/Excel──► Admin

Admin ──params──► [6.0 Report Generation] ──read──► [Attendance DB]
Admin ◄── report──

Admin ──settings──► [7.0 Settings Management] ──CRUD──► [Settings DB]
```

---

## B.3 Level 2 DFD — Face Recognition (Expanded)

```
Webcam ──frame──► [4.1 Capture Frame]
                        │
                        ▼
                 [4.2 Detect Face]  ──no face──► discard
                        │
                       face region
                        │
                        ▼
                 [4.3 Compute Encoding] ──128D vector──►
                        │
                        ▼
                 [4.4 Load DB Encodings] ◄── [Student DB]
                        │
                        ▼
                 [4.5 Compare Encodings]
                        │
              ┌─────────┴──────────┐
           match                no match
              │                      │
              ▼                      ▼
         [4.6 Get Confidence]    [4.7 Return
              │                   Not Recognized]
              ▼
         [4.8 Check Duplicate]
              │
         ┌────┴────┐
      new today  already
              │       │
              ▼       ▼
         [4.9 Mark  Return
          Attendance] Already
                     Marked
```

---

## PART C: ENTITY-RELATIONSHIP (ER) DIAGRAM

---

## C.1 ER Diagram (Chen Notation)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│    [admin_id]  [username]  [password]  [full_name]                │
│         │          │           │           │                       │
│         └──────────┴─────┬─────┴───────────┘                      │
│                     ┌────┴────┐                                    │
│                     │  ADMIN  │                                    │
│                     └─────────┘                                    │
│                                                                    │
│  [student_id] [name] [gender] [dept] [course] [sem] [face_enc]    │
│        │         │      │       │       │       │        │         │
│        └─────────┴──────┴───────┴───────┴───────┴────────┘        │
│                              │                                     │
│                        ┌─────┴──────┐                             │
│                        │  STUDENT   │                             │
│                        └─────┬──────┘                             │
│                              │                                     │
│                         1 ◄──┘──► N                               │
│                              │                                     │
│                    ┌─────────┴──────────┐                         │
│                    │  HAS_ATTENDANCE    │                          │
│                    └─────────┬──────────┘                         │
│                              │                                     │
│                        ┌─────┴──────┐                             │
│                        │ ATTENDANCE │                             │
│                        └─────┬──────┘                             │
│      [id][date][time]        │    [status][confidence]            │
│            │                 │           │                         │
│            └─────────────────┘───────────┘                        │
│                              │                                     │
│                         N ◄──┘──► 1                               │
│                              │                                     │
│                    ┌─────────┴──────────┐                         │
│                    │   FOR_SUBJECT      │                          │
│                    └─────────┬──────────┘                         │
│                              │                                     │
│                        ┌─────┴──────┐                             │
│                        │  SUBJECT   │                             │
│                        └────────────┘                             │
│                                                                    │
│  [id][subject_code][subject_name][department][semester][faculty]  │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## C.2 ER Diagram — Crow's Foot Notation

```
admins                    students
┌─────────────────┐       ┌─────────────────────────────┐
│ id (PK)         │       │ student_id (PK)              │
│ username        │       │ name                         │
│ hashed_password │       │ gender                       │
│ full_name       │       │ date_of_birth                │
│ is_active       │       │ department                   │
│ created_at      │       │ course                       │
└─────────────────┘       │ semester                     │
                          │ section                      │
                          │ phone                        │
                          │ email                        │
                          │ photo_path                   │
                          │ face_encoding                │
                          │ has_face_encoding            │
                          │ is_active                    │
                          └──────────────┬──────────────┘
                                         │
                                         │ 1 ──────────── N
                                         │
subjects                             attendance
┌─────────────────┐       ┌─────────────────────────────┐
│ id (PK)         │       │ id (PK)                      │
│ subject_code    │       │ student_id (FK → students)   │
│ subject_name    ├──1─N──│ subject_id (FK → subjects)   │
│ department      │       │ date                         │
│ semester        │       │ time                         │
│ faculty         │       │ status                       │
│ is_active       │       │ confidence                   │
└─────────────────┘       │ created_at                   │
                          └─────────────────────────────┘

app_settings (singleton)
┌─────────────────────────────────┐
│ id (PK)                         │
│ app_name                        │
│ recognition_threshold           │
│ camera_index                    │
│ camera_resolution               │
│ theme                           │
└─────────────────────────────────┘
```

---

## C.3 ER Diagram Relationships Table

| Relationship | Type | Description |
|-------------|------|-------------|
| Student — Attendance | 1 : N (One-to-Many) | One student has many attendance records |
| Subject — Attendance | 1 : N (One-to-Many) | One subject has many attendance records |
| Admin — System | 1 : N (One-to-Many) | One admin manages all records |
| Attendance — Date | N : 1 | Many records for same date |

---

*Document Version: 1.0 | Date: August 2025*
