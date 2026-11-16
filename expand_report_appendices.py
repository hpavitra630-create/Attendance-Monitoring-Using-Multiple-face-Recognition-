from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

PATH = Path('reports/Face_Recognition_Attendance_Monitoring_Project_Report.docx')

def font(run, size=11, bold=False):
    run.font.name = 'Times New Roman'
    run._element.rPr.rFonts.set(qn('w:ascii'), 'Times New Roman')
    run._element.rPr.rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    run.font.size = Pt(size); run.bold = bold; run.font.color.rgb = RGBColor(0,0,0)

def para(doc, text, bold=False):
    p=doc.add_paragraph(); p.paragraph_format.line_spacing=1.5; p.paragraph_format.space_after=Pt(8); p.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
    font(p.add_run(text), 11.5, bold); return p

def heading(doc, text, level=1):
    p=doc.add_paragraph(); p.paragraph_format.keep_with_next=True; p.paragraph_format.space_after=Pt(10)
    font(p.add_run(text), 14 if level==1 else 12.5, True); return p

def shade(cell, value):
    pr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),value); pr.append(shd)

def table(doc, headers, rows):
    t=doc.add_table(rows=1, cols=len(headers)); t.style='Table Grid'; t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for i,h in enumerate(headers):
        c=t.rows[0].cells[i]; c.text=''; shade(c,'1F4E78'); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p=c.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run(h); font(r,9.5,True); r.font.color.rgb=RGBColor(255,255,255)
    for ri,row in enumerate(rows):
        cells=t.add_row().cells
        for i,v in enumerate(row):
            cells[i].text=''; cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if ri%2: shade(cells[i],'F2F6FA')
            p=cells[i].paragraphs[0]; p.paragraph_format.space_after=Pt(1); r=p.add_run(str(v)); font(r,9.5)
    return t

def page(doc, title, paragraphs, tbl=None):
    doc.add_page_break(); heading(doc,title)
    for text in paragraphs: para(doc,text)
    if tbl: table(doc,*tbl)

def build():
    d=Document(PATH)
    # Materially detailed appendices are common in final year project reports and
    # document the screens, data contract, tests, and deployment in a usable form.
    doc=d
    page(doc,'APPENDICES',[
        'The appendices provide supporting technical documentation for the Attendance Monitoring Using Face Recognition for Students project. They are included to make the report useful to an evaluator who wishes to understand the user workflow, database entities, REST interfaces, test cases, source structure, deployment procedure, and operating precautions.',
        'The main chapters describe the rationale and design of the system. The following pages record the detailed operational material that would otherwise make the core chapters difficult to read. The appendix material is directly related to the implemented application and can be used as an installation, demonstration, and maintenance reference.'
    ])

    # Appendix A: User Manual (7)
    user_pages=[
        ('APPENDIX A USER MANUAL OVERVIEW',[
            'The application is operated through a web browser. The administrator starts the FastAPI backend and React frontend, opens the local application address, and signs in using an authorized account. After login, the sidebar provides access to Dashboard, Students, Face Registration, Take Attendance, Class Sessions, Attendance Records, Subjects, Reports, Settings, and Audit Logs.',
            'The dashboard is the starting point for daily work. It summarizes the number of active students, students marked present, absences, attendance percentage, recent records, and the weekly trend. The summary is derived from the attendance database; therefore, the dashboard should be checked after class scanning is complete rather than used as the only evidence of a record.'
        ]),
        ('APPENDIX A1 STUDENT REGISTRATION PROCEDURE',[
            'To create a student, open Students and select Register Student. Enter a unique student ID, name, department, course, semester, section, and optional contact information. The ID is the operational key used by the attendance records and stored face encoding. Consistent naming and ID conventions should be used before a large import or classroom deployment.',
            'A profile photograph may be selected in the Student Photo panel. The system saves the photo with the student record. Administrators should review the preview before saving because a photo with several people, a side profile, or poor lighting can lead to a weak facial template. The system accepts common image types such as JPEG and PNG.',
            'After the record is created, the student appears in the searchable student list. The detail page can be used to verify the department, status, photo, and attendance history. Deactivation is preferred over permanent removal when historic attendance records must be retained.'
        ]),
        ('APPENDIX A2 PHOTO BASED FACE ENROLMENT',[
            'The project supports face enrolment from a single uploaded portrait. While adding or editing a student, upload a clear frontal image and select the option Use this photo for face recognition. On saving, the system stores the portrait as a face sample, clears earlier samples for that student when requested, generates an SFace embedding, and marks the student as having a face encoding.',
            'For reliable enrolment, the image should contain one person, a visible face, even lighting, no significant occlusion, and a frontal orientation. Photographs with masks, dark sunglasses, extreme pose, heavy blur, or tiny faces should be avoided. A single photo is useful for quick enrolment, but multiple webcam samples from small pose variations normally improve matching robustness.',
            'If encoding fails, the student record is still saved. The administrator can correct the image and repeat photo enrolment or use the separate Face Registration page to capture multiple webcam samples.'
        ]),
        ('APPENDIX A3 WEBCAM FACE REGISTRATION',[
            'The Face Registration page provides the alternative webcam workflow. Search for a student by name or student ID, select a camera, start the camera stream, and capture several samples. The interface displays the sample count and allows a retake before the encoding is generated.',
            'The recommended capture routine is to keep the face centered, take samples under good illumination, use a neutral expression, and include small left/right head variations. The backend validates image type and size, stores the samples in a student-specific folder, and then averages valid SFace embeddings to create a normalized encoding.',
            'After the encoding operation completes, the application records a face-registration audit event. This helps an administrator identify when an identity template was created or replaced.'
        ]),
        ('APPENDIX A4 SUBJECTS AND CLASS SESSIONS',[
            'Before controlled attendance is taken, an administrator creates the academic subjects. A subject contains a code, name, department, semester, faculty name, and active status. Only relevant active subjects should be retained in the selection list to reduce operator error.',
            'A class session is then created for the date and optionally linked to a subject. Sessions move through draft, active, completed, or cancelled states. The application permits attendance marking only when a selected session is active and corresponds to the current date. If a session has a subject, it is treated as the source of truth for the attendance record.',
            'This session control is important because it prevents accidental scanning into an old, unfinished, or incorrectly selected class. It also creates a clearer audit trail for practical demonstrations and later reporting.'
        ]),
        ('APPENDIX A5 TAKING MULTI FACE ATTENDANCE',[
            'Open Take Attendance, select a subject or active class session, choose the required webcam, and start the camera. The browser requests permission to use the video device. The application captures a frame at a configured interval, currently three seconds, and submits the frame to the multiple-face recognition API.',
            'YuNet detects candidates in the frame and returns bounding boxes. The interface draws a box for every detected face. Green represents an attendance record marked, yellow represents an unknown face or an already-marked student, blue represents an item being processed, and red represents an attendance-marking error. Each recognized box shows the student name and match confidence.',
            'The practical recommendation is to scan four to ten students at once. The detector is configured to retain up to twenty candidates, but individual faces must remain sufficiently large and must not overlap heavily. Students who are not active or do not have a valid encoding are not marked.'
        ]),
        ('APPENDIX A6 RECORDS REPORTS AND MAINTENANCE',[
            'Attendance Records supports filtering by date range, department, status, student ID, and subject. A record can be corrected when a reason is provided. The system retains the old and new status, the reason, the operator, and the timestamp in an immutable correction-history table.',
            'The Reports page supplies daily, monthly, student-specific, and subject-related reporting views. Filtered results can be exported as CSV or Excel files. These exports are suitable for submission to department staff or for additional analysis in spreadsheet software.',
            'Settings provides recognition configuration, camera preferences, database backup, and restore operations. Before restoring a backup, the administrator should create a new backup of the current state, because restore replaces the current database state.'
        ])]
    for title,ps in user_pages: page(doc,title,ps)

    # Appendix B: data model (6)
    schema_pages=[
        ('APPENDIX B DATABASE DESIGN OVERVIEW',[
            'SQLite is used as the transactional database. SQLAlchemy maps the relational entities to Python models, while the actual image files and face embeddings are stored in application folders. This separation keeps large binary files out of the core attendance tables while preserving references needed for management and verification.',
            'The main relational entities are Admin, Student, Subject, AttendanceSession, Attendance, AttendanceCorrection, AppSettings, and AuditLog. Foreign-key style relationships connect an attendance record to a student, subject, and optional session. The design allows the application to query records by person, class, date, or subject.'
        ],(['Entity','Purpose','Key Fields'],[
            ['Admin','Authenticated system operator','username, hashed_password, full_name'],
            ['Student','Academic profile and enrollment state','student_id, name, department, course, is_active'],
            ['Subject','Academic subject definition','subject_code, subject_name, department'],
            ['AttendanceSession','Controlled class attendance window','session_date, subject_id, status'],
            ['Attendance','Daily attendance evidence','student_id, subject_id, date, status, confidence'],
        ])),
        ('APPENDIX B1 STUDENT ENTITY',[
            'The Student entity stores the information required to identify a learner in academic workflows. The unique student_id is used in recognition, attendance, reports, and face storage names. Optional USN, contact, photo-path, semester, and section values support institutional reporting without making every field mandatory for a demonstration database.',
            'The has_face_encoding flag indicates that an embedding exists for the student. The face_encoding_path records the storage location. The is_active flag is central to recognition safety: deactivated students are filtered from the encoding load operation and cannot be recognized for new attendance. Historical records remain available for reports.',
            'Student photos are saved separately from face samples. A profile photo is for visual administration, whereas face samples are inputs to the recognition model. The same clear portrait may be used for both when photo-based enrolment is selected.'
        ]),
        ('APPENDIX B2 SUBJECT AND SESSION ENTITIES',[
            'The Subject entity describes a course or paper that appears in attendance records. A code and name make reports readable, while department and semester allow filtering. The is_active property permits an obsolete or completed subject to be removed from normal selection without destroying historical records.',
            'AttendanceSession represents a scheduled or currently active class. The session_date establishes when attendance is valid, and subject_id links the session to its subject when known. Status values draft, active, completed, and cancelled enforce a controlled progression. Only active sessions accept new attendance records.',
            'When a session is selected, the backend verifies both the status and date. If the session has an assigned subject, the backend applies that subject even when the user interface sends a different or empty subject value.'
        ]),
        ('APPENDIX B3 ATTENDANCE ENTITY',[
            'Attendance is the central transaction entity. It stores student_id, subject_id, optional session_id, date, time, status, confidence, recognition_method, and match_score. The recognition method distinguishes face-recognition records from manual fallback records. Confidence and match score preserve useful context for a later review of automated results.',
            'Before a record is inserted, the AttendanceService verifies that the student exists and validates the session when one is supplied. It then searches for an existing record with the same student, subject, and date. If a record already exists, the new request is rejected rather than silently creating a duplicate.',
            'This rule is particularly important for periodic camera scanning. A student can remain visible in several frames, yet only the first valid frame creates an attendance record. Later scans are shown as already marked in the user interface.'
        ]),
        ('APPENDIX B4 CORRECTION AND AUDIT ENTITIES',[
            'AttendanceCorrection stores the correction history for an attendance record. Instead of overwriting a status with no explanation, the application requires a reason and stores the old status, new status, student, operator, and timestamp. This mechanism supports accountability when an operator changes Present, Absent, Late, or Excused status.',
            'AuditLog records high-level actions such as login, face registration, attendance marking, attendance deletion, student deletion, password changes, and report exports. Each entry records an action, username, entity, entity ID, and details. Audit records are useful during project evaluation because they demonstrate that the system can explain administrative changes.'
        ]),
        ('APPENDIX B5 FILE STORAGE AND DATA INTEGRITY',[
            'Face samples are stored in a directory structure organized by student ID. Face encodings are stored as serialized numeric vectors using the student ID as the filename. Student profile photographs are stored in a separate students directory. This organization makes it easy to trace a stored file to its corresponding database record.',
            'The application checks file type and enforces an image-size limit before accepting a face sample. It also verifies the student record before allowing an upload. The database uses application-level duplicate checks and error handling around insert operations. Backup and restore functions protect the SQLite database but should be used carefully because restore replaces the active data state.'
        ])]
    for title,ps,*rest in schema_pages: page(doc,title,ps,rest[0] if rest else None)

    # Appendix C API reference (12 pages)
    api_pages=[
        ('APPENDIX C API REFERENCE INTRODUCTION',['The backend exposes REST-style endpoints under the /api prefix. Protected endpoints require a JWT bearer token obtained from login. The React client attaches this token through an Axios interceptor. The API is documented interactively at the FastAPI documentation route when the backend is running.']),
        ('APPENDIX C1 AUTHENTICATION API',['POST /api/auth/login accepts a username and password and returns an access token for valid credentials. GET /api/auth/me returns information about the authenticated administrator. POST /api/auth/logout terminates the client-side login workflow. The token is required for all administrative operations.'],(['Endpoint','Method','Purpose'],[['/api/auth/login','POST','Authenticate administrator and issue JWT'],['/api/auth/me','GET','Return current authenticated user'],['/api/auth/logout','POST','Log out current user']])),
        ('APPENDIX C2 STUDENTS API',['GET /api/students lists active students with filters for search, department, course, semester, and section. POST /api/students creates a student and can accept multipart profile-photo data. PUT /api/students/{student_id} updates a student. DELETE /api/students/{student_id} deactivates the student rather than removing attendance history.'],(['Endpoint','Method','Purpose'],[['/api/students','GET','List and filter students'],['/api/students','POST','Create student with optional photo'],['/api/students/{student_id}','GET','Get student profile'],['/api/students/{student_id}','PUT','Update student'],['/api/students/{student_id}','DELETE','Deactivate student']])),
        ('APPENDIX C3 STUDENT FACE STATUS API',['GET /api/students/{student_id}/face returns the face-registration status for an individual student. DELETE /api/students/{student_id}/face removes the stored face encoding when an enrollment must be replaced. These endpoints allow an operator to distinguish between a profile with no registered face and a profile that is ready for recognition.']),
        ('APPENDIX C4 FACE REGISTRATION API',['POST /api/face/register accepts student_id, sample_index, an image file, and an optional replace_existing flag. The endpoint validates the student and image, optionally removes older samples, stores the new sample, and returns a count. POST /api/face/encode reads stored samples, creates a normalized average embedding, saves it, updates the student, and writes an audit event.'],(['Endpoint','Method','Purpose'],[['/api/face/register','POST','Store webcam or uploaded photo sample'],['/api/face/encode','POST','Generate and save student embedding'],['/api/face/sample-count/{student_id}','GET','Return sample count and encoding status']])),
        ('APPENDIX C5 SINGLE FACE RECOGNITION API',['POST /api/face/recognize accepts one image frame and compares the strongest detected face with registered encodings. It returns recognized status, student ID, name, department, confidence, and a message. This endpoint remains useful for simple one-person recognition and compatibility with earlier workflows.']),
        ('APPENDIX C6 MULTI FACE RECOGNITION API',['POST /api/face/recognize-multiple is the classroom endpoint. It decodes an image, loads active encodings, calls the multi-face recognition service, removes duplicate matches of the same student, enriches each match with student data, and returns all faces, face_count, and recognized_count. It does not directly write attendance; the client calls the attendance endpoint for each recognized student.'],(['Response field','Meaning'],[['faces','Detected faces including recognition state, confidence, and bounding box'],['face_count','Number of faces returned by detector'],['recognized_count','Number of unique active students recognized'],['box','top, right, bottom, left coordinates used by the live overlay']])),
        ('APPENDIX C7 RECOGNITION ENGINE API',['POST /api/recognition/process exposes the more modular recognition engine. It processes an uploaded image and returns recognition results with boxes and matching information, without writing attendance. This separation is useful for future integrations because the recognition engine remains independent from business rules.']),
        ('APPENDIX C8 ATTENDANCE API',['POST /api/attendance/mark accepts student_id, optional subject_id, optional session_id, confidence, recognition_method, match_score, and status. It creates a validated record or returns an already_marked response. GET /api/attendance provides filtered records, while GET /api/attendance/today returns the current-day summary.'],(['Endpoint','Method','Purpose'],[['/api/attendance/mark','POST','Validate and create attendance'],['/api/attendance','GET','List filtered attendance'],['/api/attendance/today','GET','Current-day attendance statistics'],['/api/attendance/check/{student_id}','GET','Check duplicate status']])),
        ('APPENDIX C9 CORRECTION API',['GET /api/attendance/{attendance_id}/corrections returns the immutable correction history. PUT /api/attendance/{attendance_id} changes status only when a non-empty reason is supplied. DELETE /api/attendance/{attendance_id} removes a record and creates an audit event. These endpoints implement a transparent correction workflow.']),
        ('APPENDIX C10 SUBJECTS AND SESSIONS API',['The subjects router supports create, list, update, and delete operations. The sessions router supports creating a class session, listing and reading sessions, starting an active session, completing it, and cancelling it. Session endpoints are essential for ensuring attendance is associated with a real class event.']),
        ('APPENDIX C11 REPORTS DASHBOARD SETTINGS API',['Dashboard endpoints return summary statistics, recent attendance, and weekly trends. Report endpoints generate daily, monthly, and student reports and export CSV or Excel. Settings endpoints read/update application settings, create database backups, list backups, and restore a selected backup. Audit-log endpoints return filtered historical activity.']),
        ('APPENDIX C12 API ERROR HANDLING',['The API uses HTTP status codes and descriptive messages. Invalid credentials return an authentication error. Missing or invalid images return a validation error. Attempts to mark a deactivated student, use an inactive session, submit an old session, or duplicate attendance return a clear failure response. The frontend displays these responses as contextual notifications rather than silently ignoring the failure.'])]
    for title,ps,*rest in api_pages: page(doc,title,ps,rest[0] if rest else None)

    # Appendix D Testing (11)
    test_pages=[]
    test_topics=[
        ('APPENDIX D TEST PLAN AND STRATEGY','The testing strategy combines backend unit/integration testing with browser-level smoke testing. Tests are run against an isolated SQLite database where possible so that normal application data is not changed. The goal is to validate business rules, not merely route availability.'),
        ('APPENDIX D1 AUTHENTICATION TEST CASES','Authentication tests cover a correct administrator login, wrong password, nonexistent user, request without a token, and request with an invalid token. These cases establish that protected routes do not expose attendance or student data without authorization.'),
        ('APPENDIX D2 STUDENT MANAGEMENT TEST CASES','Student tests cover creation, duplicate student ID rejection, retrieval by ID, missing-record handling, update, and deactivation. They verify that student IDs remain unique and that standard CRUD operations can support enrollment management.'),
        ('APPENDIX D3 SUBJECT MANAGEMENT TEST CASES','Subject tests verify creation, retrieval, and duplicate subject-code rejection. The tests ensure that class attendance can be associated with structured academic subjects instead of free-text labels.'),
        ('APPENDIX D4 ATTENDANCE VALIDATION TEST CASES','Attendance tests verify missing student rejection, list retrieval, and daily statistics. Workflow tests further verify that an attendance session cannot receive marks while in draft state and can receive marks only after it becomes active.'),
        ('APPENDIX D5 MULTI FACE RECOGNITION TEST CASES','The multi-face API test supplies a simulated frame response containing multiple boxes, two recognized students, a repeated detection of one recognized student, and one unknown face. The endpoint returns four detected faces but only two unique recognized students. This confirms deduplication at the API response layer.'),
        ('APPENDIX D6 DETECTOR CAPACITY TEST CASES','A configuration test confirms that the YuNet detector is created with top_k equal to 20. A real composite-frame check made from a registered sample produces four detected face candidates in a four-face frame. This verifies that the previous one-face detector limit is no longer present.'),
        ('APPENDIX D7 SESSION AND CORRECTION WORKFLOW','The faculty attendance workflow test creates a student, creates a subject, creates a session, attempts a rejected draft mark, starts the session, marks attendance, corrects the status to Late, reads correction history, and checks the attendance audit record. This test validates a multi-step real workflow.'),
        ('APPENDIX D8 REPORT AND EXPORT TEST CASES','Report tests verify daily and monthly report endpoints, CSV export, Excel export, and database backup response. Export tests also check the expected content type so that generated files can be downloaded by the browser.'),
        ('APPENDIX D9 BROWSER SMOKE TEST','The browser smoke test opens the running application in Chromium, verifies redirection to login, signs in, confirms the dashboard, visits class sessions, attendance records, reports, and audit logs, and checks browser-console errors. This complements API testing by validating navigation and authentication integration.'),
        ('APPENDIX D10 TEST SUMMARY','The current backend suite contains thirty passing tests. The successful test coverage demonstrates that the core application features, attendance rules, reporting, and multi-face API response operate as intended. Physical camera and real classroom tests remain necessary for final acceptance because environmental conditions cannot be fully simulated in a headless automated browser.')]
    for title,body in test_topics: page(doc,title,[body,'The expected outcome is that the system either completes the intended operation or produces a clear, safe error message. Tests are rerun after changes to the recognition or attendance workflow so that regression failures are detected before demonstration.'])

    # Appendix E implementation (8), Appendix F deployment (6), Appendix G UI guide (7)
    implementation=[
        ('APPENDIX E SOURCE STRUCTURE','The source is organized into frontend and backend directories. The frontend contains pages, layouts, components, hooks, and the API client. The backend contains routers, models, schemas, services, recognition modules, authentication utilities, tests, and configuration. This separation keeps visual interaction distinct from business rules and computer vision.'),
        ('APPENDIX E1 FRONTEND ATTENDANCE PAGE','The Take Attendance page enumerates webcam devices, starts and stops a selected stream, captures an image through a hidden canvas, and posts multipart image data to the multi-face endpoint. It maintains state for the selected subject, session, recognition result, camera condition, processing flag, and latest frame results.'),
        ('APPENDIX E2 LIVE BOX COORDINATE MAPPING','The face API returns coordinates relative to the original video frame. The browser video uses object-fit cover, which may crop the displayed image. The overlay implementation calculates a scale factor and horizontal/vertical offset, then converts top, right, bottom, and left coordinates to the visible video area. This keeps the box aligned to the correct face.'),
        ('APPENDIX E3 BACKEND ROUTER DESIGN','FastAPI routers group endpoints by responsibility. Dependencies provide a database session and current authenticated user. The router remains focused on request validation and response format, while services perform attendance checks, storage operations, and audit logging.'),
        ('APPENDIX E4 FACE ENCODING IMPLEMENTATION','The face encoding service loads YuNet and SFace models lazily. A sample image is decoded into an OpenCV matrix, a face is detected and aligned, an SFace feature is extracted, and the vector is normalized. Multiple samples can be averaged before final normalization.'),
        ('APPENDIX E5 MULTI FACE MATCHING IMPLEMENTATION','For a classroom frame, the service calls the detector once, loops through detected faces, aligns and encodes each face, calculates cosine similarity against stored embeddings, and returns a candidate result. The router then selects the strongest result for a repeated student ID and preserves unknown faces for operator feedback.'),
        ('APPENDIX E6 ATTENDANCE SERVICE IMPLEMENTATION','The attendance service is the enforcement point for data integrity. It validates the session state and date, resolves the session subject, checks for an existing record, validates the student, saves a transaction, and handles integrity errors. This design makes duplicate prevention independent of the browser interface.'),
        ('APPENDIX E7 AUDIT AND REPORT IMPLEMENTATION','Audit records are created after key mutations. Reports query attendance with the relevant date, status, department, and subject filters, then transform the data for dashboard cards or export files. Distinct student counts are used where necessary so repeated subject records do not inflate present-today totals.')]
    for t,b in implementation: page(doc,t,[b,'The implementation style favors clear interfaces between modules. This makes the project easier to demonstrate, test, and extend. An evaluator can trace an attendance event from a camera frame through recognition, validation, database storage, audit logging, and report output.'])

    deployment=[
        ('APPENDIX F INSTALLATION REQUIREMENTS','The project requires a supported Python installation, Node.js, a browser, and a webcam for live operation. A Python virtual environment isolates backend dependencies. The frontend uses npm to install JavaScript dependencies. OpenCV model files must be present in the backend models directory for face recognition.'),
        ('APPENDIX F BACKEND STARTUP','Create or activate the backend virtual environment, install packages listed in requirements, configure environment values including SECRET_KEY, and run Uvicorn with the application module. The backend provides a health endpoint and interactive documentation. A correct working directory is important because database, upload, and face-encoding paths are relative to the backend.'),
        ('APPENDIX F FRONTEND STARTUP','Install frontend packages with npm and run the Vite development server. The Vite configuration proxies API and upload requests to the backend. The browser is opened at the frontend address, and the application redirects unauthenticated users to the login page.'),
        ('APPENDIX F DATA BACKUP AND RECOVERY','The settings interface creates timestamped SQLite backups. Administrators should back up data before major bulk imports, database restore, or project demonstrations. Restore must be performed carefully because it replaces the current database state. Face sample and encoding folders should also be copied when a complete migration is required.'),
        ('APPENDIX F SECURITY OPERATING GUIDELINES','The default demonstration credentials should be changed before deployment. SECRET_KEY must be stored safely, browser access should use HTTPS outside local development, and uploaded images should be handled according to institutional privacy rules. Only authorized staff should access audit logs and backup files.'),
        ('APPENDIX F CLASSROOM OPERATING CHECKLIST','Before a live class, confirm that the backend health endpoint responds, the correct camera is selected, the session is active, the correct subject is selected, and the required students are active and encoded. During scanning, ensure faces are lit and non-overlapping. After scanning, inspect the records page and use manual attendance only for unresolved cases.')]
    for t,b in deployment: page(doc,t,[b,'Following this procedure reduces avoidable demonstration failures and makes attendance records more reliable. The system is designed for controlled use by an authorized operator, not for unattended operation.'])

    ui=[
        ('APPENDIX G SCREEN GUIDE LOGIN AND DASHBOARD','The Login screen accepts administrator credentials and stores the resulting JWT in the browser. The Dashboard immediately presents operational statistics, recent attendance, and a weekly trend. This allows the operator to verify that the system is connected to the database before starting class activities.'),
        ('APPENDIX G SCREEN GUIDE STUDENTS','The Students screen is the enrollment workspace. It lists active students and provides registration, editing, search, filtering, face status, and navigation to student detail. The registration form includes a dedicated photo panel and an option to use the photo to create a facial encoding.'),
        ('APPENDIX G SCREEN GUIDE FACE REGISTRATION','The Face Registration screen is intended for higher-quality webcam enrollment. It presents student search, camera selection, live camera feed, capture buttons, sample count, encoding action, and student information. It can be used even after photo-based registration when additional samples are desired.'),
        ('APPENDIX G SCREEN GUIDE TAKE ATTENDANCE','The Take Attendance screen presents camera selection, subject and session selectors, a live video pane, live face boxes, scanning indicator, current recognition information, and a classroom frame results list. It also provides manual fallback for a student whose face cannot be recognized.'),
        ('APPENDIX G SCREEN GUIDE SESSIONS AND RECORDS','The Class Sessions screen lets a faculty operator create and control attendance sessions. The Attendance Records screen displays detailed transactions and enables filtering, correction, history viewing, deletion, and export. These screens form the main administrative evidence trail.'),
        ('APPENDIX G SCREEN GUIDE REPORTS AND SETTINGS','The Reports screen produces daily, monthly, subject, and student summaries with export actions. Settings controls recognition and camera preferences as well as backup and restore. Both screens should be restricted to responsible administrators because they affect reporting and persistent data.'),
        ('APPENDIX G SCREEN GUIDE AUDIT LOGS','The Audit Logs screen provides searchable operational history. It can show actions such as attendance marked, attendance deleted, face registered, student deleted, password changed, and export actions. Audit information is especially valuable in a final project demonstration because it shows that changes can be traced to an authenticated operator.')]
    for t,b in ui: page(doc,t,[b,'The screen design uses direct labels, status messages, and visible results to help an operator understand what happened. The system avoids hiding an unsuccessful recognition: unknown faces and already-marked records are explicitly displayed.'])

    d.core_properties.title='Attendance Monitoring Using Face Recognition for Students Complete Project Report'
    d.save(PATH)
    print(PATH.resolve())

if __name__=='__main__': build()
