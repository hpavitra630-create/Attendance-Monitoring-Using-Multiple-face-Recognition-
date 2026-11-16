# Future Enhancements
## Attendance Monitoring Using Face Recognition for Students

This file records features that are deliberately deferred from the MVP.
Required by: MASTER_PROMPT §47

> Do NOT implement these features unless explicitly requested. If a future feature is 
> suggested, add it here rather than building it immediately.

---

## FR-FE-001: Liveness Detection
**Priority:** High (after MVP)  
**Description:** Add anti-spoofing to prevent attendance via photos or video.  
**Reason Deferred:** Requires dedicated ML model or specialized hardware (e.g., IR camera). Out of scope for academic MVP.

---

## FR-FE-002: Mobile Application
**Priority:** Medium  
**Description:** Native iOS/Android app for attendance taking.  
**Reason Deferred:** Academic report notes this as a future enhancement. Web-based MVP is sufficient for demonstration.

---

## FR-FE-003: Cloud Database (PostgreSQL on Cloud)
**Priority:** Medium  
**Description:** Migrate from SQLite to a hosted PostgreSQL instance.  
**Reason Deferred:** Local SQLite is acceptable for academic MVP. Migration path is straightforward when needed.

---

## FR-FE-004: Multi-Camera Support
**Priority:** Low  
**Description:** Support multiple cameras for large lecture halls.  
**Reason Deferred:** Single-camera is sufficient for demonstration.

---

## FR-FE-005: Advanced Analytics Dashboard
**Priority:** Low  
**Description:** Attendance trends, charts, department-level heatmaps.  
**Reason Deferred:** Basic dashboard covers MVP. Analytics can be added using Chart.js.

---

## FR-FE-006: Low-Attendance Alerts / Notifications
**Priority:** Low  
**Description:** Email/SMS alerts when a student's attendance falls below a threshold.  
**Reason Deferred:** Requires email service integration (SMTP/SendGrid).

---

## FR-FE-007: Student Portal (Student Login)
**Priority:** Low  
**Description:** Allow students to log in and view their own attendance.  
**Reason Deferred:** PRD §6.3 notes this as a future version feature.

---

## FR-FE-008: WebSocket Live Recognition Stream
**Priority:** Medium  
**Description:** Replace REST polling in live attendance with WebSocket for real-time face-box overlays.  
**Reason Deferred:** REST-based recognition is sufficient for MVP. TRD §33 marks WebSockets as optional.

---

## FR-FE-009: Timetable / Schedule Integration
**Priority:** Low  
**Description:** Auto-create sessions based on class timetable.  
**Reason Deferred:** Full ERP features are explicitly excluded from MVP scope (PRD §5).

---

## FR-FE-010: Docker Compose Deployment
**Priority:** Medium  
**Description:** `docker-compose.yml` for one-command deployment.  
**Reason Deferred:** Local deployment without Docker is sufficient for academic submission.
