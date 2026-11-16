# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Project Title:** Attendance Monitoring System Using Face Recognition for Students  
**Version:** 1.0  
**Date:** August 2025  
**Prepared By:** Ananya D.J, H Pavitra, K Sri Krupa, Mamatha U  
**Institution:** Rao Bahadhur Y. Mahabaleswarappa Engineering College (RYMEC), Ballary  
**Department:** Information Science and Engineering  
**Guide:** Prof. Mahantesh H M (Ph.D)  
**HOD:** Dr. B. Sreepathi (Ph.D)

---

## 1. Executive Summary

The Attendance Monitoring System Using Face Recognition is a web-based application designed to automate the process of recording student attendance in educational institutions. The system uses facial recognition technology to identify students and mark their attendance automatically, eliminating manual roll calls, proxy attendance, and paper-based records.

---

## 2. Problem Statement

Traditional attendance systems in educational institutions face several challenges:
- **Manual roll calls** are time-consuming and disrupt lectures
- **Proxy attendance** — students mark each other's attendance fraudulently
- **Paper records** are difficult to maintain, search, and analyze
- **Human error** in recording attendance
- **No real-time data** available to administrators

### Current Pain Points
| Pain Point | Impact | Frequency |
|-----------|--------|-----------|
| Time spent on roll call | 5–10 minutes per class | Daily |
| Proxy attendance fraud | 15–30% attendance inflation | Weekly |
| Report generation | 2–4 hours manual work | Monthly |
| Data loss risk | Complete record loss | Occasional |
| Error in manual entry | Incorrect attendance data | Daily |

---

## 3. Product Vision

> *"A smart, secure, real-time attendance management system that uses face recognition to automatically mark student attendance — saving time, eliminating fraud, and providing instant analytics to educators."*

---

## 4. Goals and Objectives

### Primary Goals
1. Automate attendance marking using facial recognition
2. Eliminate proxy attendance completely
3. Provide real-time attendance dashboards
4. Enable data export and reporting
5. Ensure secure access through admin authentication

### Measurable Objectives
- Reduce attendance marking time from 10 min → < 30 seconds
- Achieve ≥ 95% face recognition accuracy
- Provide reports within 1 click
- Support 200+ students per institution
- 99% data integrity through database persistence

---

## 5. Target Users

### Primary Users

**Admin / Faculty (Primary)**
- Role: Mark attendance, manage students/subjects
- Technical level: Basic computer literacy
- Frequency: Daily use
- Needs: Simple UI, fast recognition, reliable system

### Secondary Users

**Department Head / Principal**
- Role: View reports and analytics
- Frequency: Weekly/monthly
- Needs: Summary reports, attendance trends

### Tertiary Users

**Students**
- Role: Subject of recognition (no login required)
- Frequency: Every class session
- Needs: Quick processing, accurate recognition

---

## 6. Product Features

### P0 — Must Have (Core)
| Feature | Description |
|---------|-------------|
| Admin Login | Secure JWT-based authentication |
| Student Management | Add, edit, delete, search students |
| Face Registration | Capture 10 face samples per student |
| Face Recognition | Real-time webcam recognition |
| Attendance Marking | Auto-mark present via recognition |
| Dashboard | Stats: total, present, absent, % |
| Attendance Records | View and filter all records |

### P1 — Should Have
| Feature | Description |
|---------|-------------|
| Subject Management | Add/edit subjects per department |
| Reports | Daily, monthly, student-wise reports |
| Export | Export attendance to CSV / Excel |
| Settings | Camera threshold, resolution config |
| Pagination | Handle large student lists |

### P2 — Nice to Have
| Feature | Description |
|---------|-------------|
| Database Backup | One-click backup to file |
| Database Restore | Restore from backup file |
| Multi-camera | Switch between multiple webcams |
| Webcam device picker | Choose specific connected camera |

### P3 — Future Scope
| Feature | Description |
|---------|-------------|
| SMS/Email alerts | Notify parents of absence |
| Mobile app | Android/iOS companion |
| Multi-institution | Cloud deployment |
| Liveness detection | Prevent photo spoofing |

---

## 7. User Stories

### Authentication
- **US-01:** As an admin, I want to login securely so that only authorized users access the system.
- **US-02:** As an admin, I want to logout so that my session is terminated securely.

### Student Management
- **US-03:** As an admin, I want to register a new student with their details so they can be tracked.
- **US-04:** As an admin, I want to upload student photos or capture from webcam for face registration.
- **US-05:** As an admin, I want to search/filter students by department, course, semester, section.
- **US-06:** As an admin, I want to edit student details to correct errors.
- **US-07:** As an admin, I want to delete a student record when they leave.

### Face Registration
- **US-08:** As an admin, I want to capture 10 face samples per student from a webcam.
- **US-09:** As an admin, I want to generate a face encoding after capturing samples.
- **US-10:** As an admin, I want to select which webcam to use when multiple are connected.
- **US-11:** As an admin, I want to retake samples if the quality is poor.

### Attendance
- **US-12:** As an admin, I want to start the webcam and have it auto-recognize faces every few seconds.
- **US-13:** As an admin, I want the system to auto-mark attendance when a face is recognized.
- **US-14:** As an admin, I want to see the student's name, ID, confidence score when recognized.
- **US-15:** As an admin, I want to filter attendance records by date, department, status.
- **US-16:** As an admin, I want to export attendance records to Excel/CSV.
- **US-17:** As an admin, I want to delete incorrect attendance records.

### Reports & Dashboard
- **US-18:** As an admin, I want to see today's attendance stats on the dashboard.
- **US-19:** As an admin, I want to generate daily, monthly, student-wise, subject-wise reports.
- **US-20:** As an admin, I want to see a pie chart of present vs absent students.

### Settings
- **US-21:** As an admin, I want to configure the face recognition threshold percentage.
- **US-22:** As an admin, I want to backup and restore the database.

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Face recognition within 2 seconds |
| **Accuracy** | ≥ 95% recognition accuracy in good lighting |
| **Availability** | System runs locally, no internet required |
| **Security** | JWT token auth, bcrypt password hashing |
| **Scalability** | Support up to 500 students |
| **Usability** | Usable by non-technical staff |
| **Reliability** | SQLite database for persistent storage |
| **Privacy** | Face encodings stored locally, no cloud |

---

## 9. Constraints

- **Hardware:** Requires a working webcam (USB or built-in)
- **Software:** Python 3.9+ and Node.js 18+ required
- **Lighting:** Good lighting required for accurate recognition
- **Faces:** One face at a time for reliable recognition
- **Internet:** Not required for operation (except initial setup)

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Recognition accuracy | ≥ 95% |
| Time to mark attendance (per person) | < 3 seconds |
| System uptime | 99% during operation |
| Reduction in manual effort | 90% |
| User satisfaction score | ≥ 4/5 |

---

## 11. Acceptance Criteria

- [ ] Admin can login and logout securely
- [ ] Admin can register a student and capture 10 face samples
- [ ] System correctly recognizes a registered student via webcam
- [ ] Attendance is automatically marked and saved to database
- [ ] Dashboard shows correct today's stats
- [ ] Records can be exported as CSV and Excel
- [ ] Reports generate correctly for selected date
- [ ] All pages match the specified UI design

---

*Document Version: 1.0 | Status: Approved | Date: August 2025*
