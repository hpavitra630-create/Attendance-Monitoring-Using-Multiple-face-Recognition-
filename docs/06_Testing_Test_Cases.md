# TESTING DOCUMENT & TEST CASES

**Project:** Attendance Monitoring System Using Face Recognition for Students  
**Version:** 1.0 | **Date:** August 2025  
**Testing Strategy:** Black Box + White Box Testing

---

## 1. Testing Overview

### 1.1 Testing Scope
This document covers all testing performed on the Attendance Monitoring System including:
- Unit Testing (individual components/functions)
- Integration Testing (frontend-backend API communication)
- System Testing (end-to-end user workflows)
- User Acceptance Testing (UAT)
- Performance Testing
- Security Testing

### 1.2 Testing Environment

| Component | Specification |
|-----------|--------------|
| OS | Windows 11 |
| Browser | Google Chrome 125 |
| Python | 3.9.x |
| Node.js | 18.x |
| Backend URL | http://localhost:8000 |
| Frontend URL | http://localhost:5173 |
| Database | SQLite 3 |
| Webcam | Integrated/USB webcam |

### 1.3 Test Case ID Convention
- **TC-AUTH-XXX** — Authentication test cases
- **TC-STU-XXX** — Student management test cases
- **TC-FACE-XXX** — Face registration test cases
- **TC-ATT-XXX** — Attendance test cases
- **TC-SUBJ-XXX** — Subject management test cases
- **TC-REP-XXX** — Reports test cases
- **TC-SET-XXX** — Settings test cases
- **TC-DASH-XXX** — Dashboard test cases

### 1.4 Test Status Legend
| Symbol | Meaning |
|--------|---------|
| ✅ PASS | Test passed as expected |
| ❌ FAIL | Test failed |
| ⚠️ PARTIAL | Partially passed |
| N/A | Not applicable |

---

## 2. Authentication Test Cases

### TC-AUTH-001: Valid Login
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-AUTH-001 |
| **Test Name** | Valid Admin Login |
| **Priority** | High |
| **Test Type** | Functional |
| **Preconditions** | Admin account exists (username: admin, password: admin123) |
| **Test Steps** | 1. Open http://localhost:5173<br>2. Enter username: admin<br>3. Enter password: admin123<br>4. Click Login button |
| **Expected Result** | Login succeeds; user redirected to Dashboard; JWT token stored in localStorage |
| **Actual Result** | ✅ PASS |

---

### TC-AUTH-002: Invalid Username
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-AUTH-002 |
| **Test Name** | Login with Wrong Username |
| **Priority** | High |
| **Test Steps** | 1. Enter username: wronguser<br>2. Enter password: admin123<br>3. Click Login |
| **Expected Result** | Error message "Invalid username or password" shown; no redirect |
| **Actual Result** | ✅ PASS |

---

### TC-AUTH-003: Invalid Password
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-AUTH-003 |
| **Test Name** | Login with Wrong Password |
| **Test Steps** | 1. Enter username: admin<br>2. Enter password: wrongpass<br>3. Click Login |
| **Expected Result** | Error message shown; no redirect |
| **Actual Result** | ✅ PASS |

---

### TC-AUTH-004: Empty Fields
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-AUTH-004 |
| **Test Name** | Login with Empty Fields |
| **Test Steps** | 1. Leave username empty<br>2. Click Login |
| **Expected Result** | Show "Please enter username and password" |
| **Actual Result** | ✅ PASS |

---

### TC-AUTH-005: Admin Quick Login
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-AUTH-005 |
| **Test Name** | "Login with Admin Account" button |
| **Test Steps** | 1. Click "Login with Admin Account" button |
| **Expected Result** | Auto-login as admin; redirect to dashboard |
| **Actual Result** | ✅ PASS |

---

### TC-AUTH-006: Session Persistence
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-AUTH-006 |
| **Test Name** | Token persists after page refresh |
| **Test Steps** | 1. Login successfully<br>2. Refresh page (F5) |
| **Expected Result** | User remains logged in; dashboard shown |
| **Actual Result** | ✅ PASS |

---

### TC-AUTH-007: Logout
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-AUTH-007 |
| **Test Name** | Admin Logout |
| **Test Steps** | 1. Login<br>2. Click Logout in sidebar |
| **Expected Result** | Redirected to login page; token cleared from localStorage |
| **Actual Result** | ✅ PASS |

---

### TC-AUTH-008: Protected Route Access Without Login
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-AUTH-008 |
| **Test Name** | Access protected page without login |
| **Test Steps** | 1. Clear localStorage<br>2. Navigate to http://localhost:5173/dashboard |
| **Expected Result** | Redirected to login page |
| **Actual Result** | ✅ PASS |

---

## 3. Student Management Test Cases

### TC-STU-001: Add Student — Valid Data
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-STU-001 |
| **Test Name** | Register Student with Valid Data |
| **Priority** | High |
| **Preconditions** | Admin logged in |
| **Test Steps** | 1. Navigate to Students > Add Student<br>2. Enter Student ID: STU001<br>3. Enter Name: John Doe<br>4. Select Gender: Male<br>5. Select Department: Computer Science<br>6. Select Course: BCA, Semester: 6, Section: A<br>7. Enter Phone: 9876543210<br>8. Enter Email: john@test.com<br>9. Click Register |
| **Expected Result** | Student created; success toast; redirected to students list |
| **Actual Result** | ✅ PASS |

---

### TC-STU-002: Duplicate Student ID
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-STU-002 |
| **Test Name** | Register Student with Existing ID |
| **Test Steps** | 1. Register student with ID STU001<br>2. Try to register another student with same ID STU001 |
| **Expected Result** | Error: "Student ID already exists" |
| **Actual Result** | ✅ PASS |

---

### TC-STU-003: Missing Required Fields
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-STU-003 |
| **Test Name** | Register Student without Required Fields |
| **Test Steps** | 1. Leave Name field empty<br>2. Click Register |
| **Expected Result** | Validation error; form not submitted |
| **Actual Result** | ✅ PASS |

---

### TC-STU-004: Search by Name
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-STU-004 |
| **Test Name** | Search Student by Name |
| **Test Steps** | 1. On Students page, type "John" in search box<br>2. Click Search |
| **Expected Result** | Only students with "John" in name displayed |
| **Actual Result** | ✅ PASS |

---

### TC-STU-005: Filter by Department
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-STU-005 |
| **Test Name** | Filter Students by Department |
| **Test Steps** | 1. Select Department: "Computer Science"<br>2. Click Search |
| **Expected Result** | Only CS students shown |
| **Actual Result** | ✅ PASS |

---

### TC-STU-006: Edit Student
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-STU-006 |
| **Test Name** | Edit Student Details |
| **Test Steps** | 1. Click edit (pencil icon) for a student<br>2. Change phone number<br>3. Click Update |
| **Expected Result** | Student updated; success toast |
| **Actual Result** | ✅ PASS |

---

### TC-STU-007: Delete Student with Confirmation
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-STU-007 |
| **Test Name** | Delete Student |
| **Test Steps** | 1. Click delete (trash icon) for a student<br>2. Click OK in confirmation dialog |
| **Expected Result** | Student deleted; removed from list; success toast |
| **Actual Result** | ✅ PASS |

---

### TC-STU-008: Delete Student — Cancel
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-STU-008 |
| **Test Name** | Cancel Student Deletion |
| **Test Steps** | 1. Click delete icon<br>2. Click Cancel in dialog |
| **Expected Result** | Student not deleted; list unchanged |
| **Actual Result** | ✅ PASS |

---

### TC-STU-009: Pagination
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-STU-009 |
| **Test Name** | Students List Pagination |
| **Test Steps** | 1. Add 12+ students<br>2. Navigate to page 2 |
| **Expected Result** | Second page shows remaining students; prev/next buttons work |
| **Actual Result** | ✅ PASS |

---

## 4. Face Registration Test Cases

### TC-FACE-001: Load Valid Student
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-FACE-001 |
| **Test Name** | Load Student for Face Registration |
| **Test Steps** | 1. Go to Face Registration<br>2. Enter STU001<br>3. Click Load Student |
| **Expected Result** | Student info shown; camera section appears |
| **Actual Result** | ✅ PASS |

---

### TC-FACE-002: Load Invalid Student
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-FACE-002 |
| **Test Name** | Load Non-existent Student |
| **Test Steps** | 1. Enter ID: STU999<br>2. Click Load Student |
| **Expected Result** | Error toast "Student not found" |
| **Actual Result** | ✅ PASS |

---

### TC-FACE-003: Webcam Device Enumeration
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-FACE-003 |
| **Test Name** | Webcam Device List |
| **Test Steps** | 1. Load student<br>2. Check webcam dropdown |
| **Expected Result** | All connected webcams listed by name |
| **Actual Result** | ✅ PASS |

---

### TC-FACE-004: Start Camera
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-FACE-004 |
| **Test Name** | Start Webcam |
| **Test Steps** | 1. Click "Start Camera" |
| **Expected Result** | Live video feed displayed; button changes to "Stop Camera" |
| **Actual Result** | ✅ PASS |

---

### TC-FACE-005: Capture Samples
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-FACE-005 |
| **Test Name** | Capture 10 Face Samples |
| **Test Steps** | 1. Start camera<br>2. Click "Capture Sample" 10 times |
| **Expected Result** | Counter shows 10/10; all squares turn green |
| **Actual Result** | ✅ PASS |

---

### TC-FACE-006: Generate Encoding
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-FACE-006 |
| **Test Name** | Generate Face Encoding |
| **Test Steps** | 1. Capture 10 samples<br>2. Click "Generate Encoding" |
| **Expected Result** | Success alert; student's has_face_encoding = true in DB |
| **Actual Result** | ✅ PASS |

---

### TC-FACE-007: Encoding with Fewer than 3 Samples
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-FACE-007 |
| **Test Name** | Generate Encoding with 2 Samples |
| **Test Steps** | 1. Capture 2 samples<br>2. Click "Generate Encoding" |
| **Expected Result** | Error: "Capture at least 3 samples first" |
| **Actual Result** | ✅ PASS |

---

### TC-FACE-008: Retake Samples
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-FACE-008 |
| **Test Name** | Retake Face Samples |
| **Test Steps** | 1. Capture 5 samples<br>2. Click "Retake" |
| **Expected Result** | Counter resets to 0/10; all squares grey |
| **Actual Result** | ✅ PASS |

---

## 5. Attendance Test Cases

### TC-ATT-001: Camera Start for Attendance
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-ATT-001 |
| **Test Name** | Start Camera for Attendance |
| **Test Steps** | 1. Go to Take Attendance<br>2. Select webcam<br>3. Click "Start Camera" |
| **Expected Result** | Video feed shown; auto-scan begins |
| **Actual Result** | ✅ PASS |

---

### TC-ATT-002: Face Recognition — Known Student
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-ATT-002 |
| **Test Name** | Recognize Registered Student |
| **Priority** | Critical |
| **Preconditions** | Student STU001 has face encoding registered |
| **Test Steps** | 1. Start camera<br>2. Have STU001 look at camera |
| **Expected Result** | Student name shown on camera overlay; Recognition Info panel filled; "Attendance Marked" shown |
| **Actual Result** | ✅ PASS |

---

### TC-ATT-003: Face Recognition — Unknown Person
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-ATT-003 |
| **Test Name** | Unregistered Face |
| **Test Steps** | 1. Start camera<br>2. Person with no registered face looks at camera |
| **Expected Result** | "Face not recognized" shown; no attendance marked |
| **Actual Result** | ✅ PASS |

---

### TC-ATT-004: Duplicate Attendance Prevention
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-ATT-004 |
| **Test Name** | Mark Attendance Twice Same Day |
| **Test Steps** | 1. Recognize student STU001<br>2. Attendance marked<br>3. Wait 3 seconds<br>4. Same student recognized again |
| **Expected Result** | "Attendance already marked today" — no duplicate record |
| **Actual Result** | ✅ PASS |

---

### TC-ATT-005: Filter Attendance by Date
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-ATT-005 |
| **Test Name** | Filter Attendance Records by Date |
| **Test Steps** | 1. Go to Attendance Records<br>2. Set Date From and Date To<br>3. Click Search |
| **Expected Result** | Only records within date range shown |
| **Actual Result** | ✅ PASS |

---

### TC-ATT-006: Filter by Status
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-ATT-006 |
| **Test Name** | Filter Attendance by Present/Absent |
| **Test Steps** | 1. Select Status: Present<br>2. Click Search |
| **Expected Result** | Only Present records shown in green |
| **Actual Result** | ✅ PASS |

---

### TC-ATT-007: Export CSV
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-ATT-007 |
| **Test Name** | Export Attendance as CSV |
| **Test Steps** | 1. Click "Export CSV" button |
| **Expected Result** | CSV file downloads with all filtered records |
| **Actual Result** | ✅ PASS |

---

### TC-ATT-008: Export Excel
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-ATT-008 |
| **Test Name** | Export Attendance as Excel |
| **Test Steps** | 1. Click "Export Excel" button |
| **Expected Result** | .xlsx file downloads |
| **Actual Result** | ✅ PASS |

---

### TC-ATT-009: Delete Selected Records
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-ATT-009 |
| **Test Name** | Delete Multiple Records |
| **Test Steps** | 1. Select 3 records using checkboxes<br>2. Click "Delete Selected (3)"<br>3. Confirm |
| **Expected Result** | 3 records deleted; list refreshed |
| **Actual Result** | ✅ PASS |

---

## 6. Subjects Test Cases

### TC-SUBJ-001: Add Subject
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-SUBJ-001 |
| **Test Name** | Add New Subject |
| **Test Steps** | 1. Click "Add Subject"<br>2. Enter Code: CS601, Name: Python Programming<br>3. Click Add Subject |
| **Expected Result** | Subject added; appears in list with Active badge |
| **Actual Result** | ✅ PASS |

---

### TC-SUBJ-002: Edit Subject
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-SUBJ-002 |
| **Test Name** | Edit Subject Details |
| **Test Steps** | 1. Click edit (pencil) on a subject<br>2. Change faculty name<br>3. Click Update |
| **Expected Result** | Subject updated |
| **Actual Result** | ✅ PASS |

---

### TC-SUBJ-003: Inactive Status Badge
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-SUBJ-003 |
| **Test Name** | Inactive Subject Badge |
| **Test Steps** | 1. Add subject with is_active = false<br>2. View subjects list |
| **Expected Result** | Red "Inactive" badge shown |
| **Actual Result** | ✅ PASS |

---

## 7. Reports Test Cases

### TC-REP-001: Daily Report
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-REP-001 |
| **Test Name** | Generate Daily Report |
| **Test Steps** | 1. Go to Reports<br>2. Select Daily Report<br>3. Pick today's date<br>4. Click Generate |
| **Expected Result** | 4 stat cards shown; pie chart visible |
| **Actual Result** | ✅ PASS |

---

### TC-REP-002: Monthly Report
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-REP-002 |
| **Test Name** | Generate Monthly Report |
| **Test Steps** | 1. Select Monthly Report<br>2. Pick a date in the month<br>3. Click Generate |
| **Expected Result** | Report for the entire month |
| **Actual Result** | ✅ PASS |

---

### TC-REP-003: Report Pie Chart Accuracy
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-REP-003 |
| **Test Name** | Pie Chart Correctness |
| **Test Steps** | 1. Generate report<br>2. Note present + absent counts<br>3. Verify chart percentages |
| **Expected Result** | Present% + Absent% = 100%; matches stat cards |
| **Actual Result** | ✅ PASS |

---

## 8. Settings Test Cases

### TC-SET-001: Save Settings
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-SET-001 |
| **Test Name** | Save Application Settings |
| **Test Steps** | 1. Change Recognition Threshold to 80%<br>2. Click "Save Settings" |
| **Expected Result** | Success toast; setting persisted in DB |
| **Actual Result** | ✅ PASS |

---

### TC-SET-002: Database Backup
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-SET-002 |
| **Test Name** | Create Database Backup |
| **Test Steps** | 1. Click "Backup Now" |
| **Expected Result** | Success toast; backup file created |
| **Actual Result** | ✅ PASS |

---

## 9. Performance Test Cases

### TC-PERF-001: Dashboard Load Time
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-PERF-001 |
| **Test Name** | Dashboard API Response Time |
| **Metric** | Time for /dashboard/stats to respond |
| **Test Steps** | 1. Login<br>2. Measure dashboard load time using browser DevTools |
| **Expected Result** | < 2 seconds total page load |
| **Actual Result** | ✅ ~1.2s |

---

### TC-PERF-002: Face Recognition Speed
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-PERF-002 |
| **Test Name** | Face Recognition API Response |
| **Metric** | Time from frame capture to result |
| **Test Steps** | 1. Start attendance with 10 registered students<br>2. Measure /face/recognize response |
| **Expected Result** | < 3 seconds |
| **Actual Result** | ✅ ~1.8s (10 students) |

---

## 10. Security Test Cases

### TC-SEC-001: Access API Without Token
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-SEC-001 |
| **Test Name** | Unauthenticated API Access |
| **Test Steps** | 1. Send GET /api/students without Authorization header |
| **Expected Result** | 401 Unauthorized |
| **Actual Result** | ✅ PASS |

---

### TC-SEC-002: Expired Token
| Field | Details |
|-------|---------|
| **Test Case ID** | TC-SEC-002 |
| **Test Name** | Access with Expired JWT |
| **Test Steps** | 1. Modify token expiry to 1s in settings<br>2. Wait 2s<br>3. Make API request |
| **Expected Result** | 401 Unauthorized |
| **Actual Result** | ✅ PASS |

---

## 11. Test Summary Report

| Module | Total TCs | Passed | Failed | Pass % |
|--------|-----------|--------|--------|--------|
| Authentication | 8 | 8 | 0 | 100% |
| Student Management | 9 | 9 | 0 | 100% |
| Face Registration | 8 | 8 | 0 | 100% |
| Attendance | 9 | 9 | 0 | 100% |
| Subjects | 3 | 3 | 0 | 100% |
| Reports | 3 | 3 | 0 | 100% |
| Settings | 2 | 2 | 0 | 100% |
| Performance | 2 | 2 | 0 | 100% |
| Security | 2 | 2 | 0 | 100% |
| **TOTAL** | **46** | **46** | **0** | **100%** |

---

## 12. Defects Log

| Defect ID | Description | Severity | Status | Resolution |
|-----------|-------------|----------|--------|-----------|
| DEF-001 | Camera permission prompt not shown on HTTPS in some browsers | Medium | Fixed | Added enumerateDevices flow |
| DEF-002 | Duplicate attendance could be marked if requests arrive simultaneously | High | Fixed | Added date+student unique check |
| DEF-003 | Port 5173 conflict causes dev server to shift ports | Low | Known | Document alternate port usage |

---

*Document Version: 1.0 | Testing Completed: August 2025*
