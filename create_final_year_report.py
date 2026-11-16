from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from pathlib import Path

OUT = Path("reports") / "Face_Recognition_Attendance_Monitoring_Project_Report.docx"


def set_cell_shading(cell, color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), color)
    tc_pr.append(shd)


def set_cell_border(cell, color="D9D9D9"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        el = borders.find(qn(tag))
        if el is None:
            el = OxmlElement(tag)
            borders.append(el)
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:color"), color)


def set_cell_margin(cell, top=90, start=110, bottom=90, end=110):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, val in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn("w:" + m))
        if node is None:
            node = OxmlElement("w:" + m)
            tc_mar.append(node)
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run("Page ")
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = "PAGE"
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)


def set_font(run, size=12, bold=False, italic=False):
    run.font.name = "Times New Roman"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Times New Roman")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Times New Roman")
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(0, 0, 0)


def add_text(doc, text, bold_lead=None):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(7)
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if bold_lead and text.startswith(bold_lead):
        set_font(p.add_run(bold_lead), bold=True)
        set_font(p.add_run(text[len(bold_lead):]))
    else:
        set_font(p.add_run(text))
    return p


def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    p.paragraph_format.line_spacing = 1.3
    p.paragraph_format.space_after = Pt(3)
    set_font(p.add_run(text))
    return p


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}")
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(14 if level == 1 else 10)
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(text)
    set_font(run, size=15 if level == 1 else 13, bold=True)
    return p


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    header = table.rows[0]
    set_repeat_table_header(header)
    for idx, value in enumerate(headers):
        cell = header.cells[idx]
        cell.text = ""
        set_cell_shading(cell, "1F4E78")
        set_cell_border(cell)
        set_cell_margin(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(value)
        set_font(run, size=10, bold=True)
        run.font.color.rgb = RGBColor(255, 255, 255)
    for r_index, row_values in enumerate(rows):
        cells = table.add_row().cells
        for idx, value in enumerate(row_values):
            cell = cells[idx]
            cell.text = ""
            if r_index % 2 == 1:
                set_cell_shading(cell, "F2F6FA")
            set_cell_border(cell)
            set_cell_margin(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            run = p.add_run(str(value))
            set_font(run, size=9.5)
        if widths:
            for idx, width in enumerate(widths):
                cells[idx].width = Inches(width)
    doc.add_paragraph().paragraph_format.space_after = Pt(3)
    return table


def chapter(doc, number, title):
    doc.add_page_break()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(18)
    set_font(p.add_run(f"CHAPTER {number}"), size=16, bold=True)
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_after = Pt(20)
    set_font(p2.add_run(title.upper()), size=15, bold=True)


def add_contents(doc):
    doc.add_page_break()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run("TABLE OF CONTENTS"), size=16, bold=True)
    entries = [
        "Acknowledgement", "Abstract", "Chapter 1 Introduction", "1.1 Background", "1.2 Problem Statement",
        "1.3 Objectives", "1.4 Scope of the Project", "1.5 Methodology", "Chapter 2 Literature Review",
        "2.1 Introduction", "2.2 Review of Existing Systems", "2.3 Research Gap", "2.4 Summary",
        "Chapter 3 System Analysis and Design", "3.1 Existing System", "3.2 Proposed System", "3.3 Requirements",
        "3.4 System Architecture and Block Diagram", "3.5 Flowchart and Methodology", "Chapter 4 Implementation",
        "4.1 Implementation Process", "4.2 Hardware and Software Implementation", "4.3 Modules and Components",
        "Chapter 5 Testing and Results", "5.1 Testing", "5.2 Results and Outcomes", "5.3 Performance Analysis",
        "Chapter 6 Conclusion and Future Scope", "6.1 Conclusion", "6.2 Limitations", "6.3 Future Scope", "References",
    ]
    for entry in entries:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.left_indent = Inches(0.15 if entry[0].isdigit() else 0)
        set_font(p.add_run(entry + " ................................................................"), size=11)


def build_report():
    OUT.parent.mkdir(exist_ok=True)
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.85)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.8)

    normal = doc.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Times New Roman")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Times New Roman")
    normal.font.size = Pt(12)
    for style_name in ("Title", "Heading 1", "Heading 2", "Heading 3"):
        style = doc.styles[style_name]
        style.font.name = "Times New Roman"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Times New Roman")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Times New Roman")
        style.font.color.rgb = RGBColor(0, 0, 0)
    footer = section.footer.paragraphs[0]
    add_page_number(footer)
    for run in footer.runs:
        set_font(run, size=9)

    # Cover page
    for _ in range(4):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run("A PROJECT REPORT ON"), size=13, bold=True)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(16)
    set_font(p.add_run("ATTENDANCE MONITORING USING FACE RECOGNITION FOR STUDENTS"), size=19, bold=True)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run("Submitted in partial fulfilment of the requirements for the award of the degree of"), size=12)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run("[DEGREE NAME]"), size=13, bold=True)
    for _ in range(2):
        doc.add_paragraph()
    for line in ("Submitted by", "[STUDENT NAME]", "USN: [UNIVERSITY SEAT NUMBER]", "Under the guidance of", "[GUIDE NAME]", "[DESIGNATION]"):
        p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_font(p.add_run(line), size=12, bold=line.startswith("[") or line in ("Submitted by", "Under the guidance of"))
    for _ in range(3):
        doc.add_paragraph()
    for line in ("[DEPARTMENT NAME]", "[COLLEGE NAME]", "[UNIVERSITY NAME]", "Academic Year [20XX - 20XX]"):
        p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_font(p.add_run(line), size=12, bold=True)

    # Acknowledgement
    doc.add_page_break()
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run("ACKNOWLEDGEMENT"), size=16, bold=True)
    add_text(doc, "I express my sincere gratitude to [Guide Name], [Designation], for valuable guidance, encouragement, and technical support throughout the development of this project. The guidance received during requirement analysis, design, implementation, and testing helped transform the idea into a usable system.")
    add_text(doc, "I thank the Head of the Department, the faculty members of [Department Name], and the management of [College Name] for providing the facilities and learning environment required to complete this work. I also acknowledge my classmates, friends, and family members for their constructive feedback and support.")
    add_text(doc, "This project was completed as an academic effort to study the application of computer vision, web technologies, and database systems in attendance management.")
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    set_font(p.add_run("[STUDENT NAME]"), bold=True)

    # Abstract
    doc.add_page_break()
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run("ABSTRACT"), size=16, bold=True)
    add_text(doc, "Attendance Monitoring Using Face Recognition for Students is a web-based system designed to reduce the time, errors, and administrative effort involved in conventional attendance procedures. In many institutions, attendance is recorded manually through roll calls, paper registers, or spreadsheets. These methods consume class time, are difficult to audit, and can permit proxy attendance. The proposed system records attendance by detecting and recognizing registered student faces through a webcam or an uploaded photograph.")
    add_text(doc, "The system uses a React and Vite frontend, a FastAPI backend, SQLite database storage through SQLAlchemy, and an OpenCV-based recognition pipeline. YuNet detects faces in an input frame and SFace generates facial embeddings. The generated embedding is compared with active student encodings to identify students. The application supports single-face and multi-face classroom recognition, with up to twenty detection candidates in a frame. Each recognized student is checked against the attendance rules before a record is created, thereby preventing duplicate attendance for the same student, subject, and day.")
    add_text(doc, "In addition to automated recognition, the system provides student registration, face registration through webcam samples or a single uploaded portrait, subject management, class sessions, manual attendance fallback, correction history, audit logs, dashboard statistics, reports, CSV and Excel export, and database backup and restore. The project demonstrates how a practical face-recognition workflow can be integrated with secure web application features to create a transparent and scalable attendance solution for academic institutions.")
    add_text(doc, "Keywords: face recognition, attendance management, computer vision, OpenCV, YuNet, SFace, FastAPI, React, SQLite, multi-face detection.")
    add_contents(doc)

    # Chapter 1
    chapter(doc, 1, "Introduction")
    add_heading(doc, "1.1 Background", 2)
    add_text(doc, "Attendance is an important academic record used to monitor participation, assess eligibility, and support institutional reporting. Despite the availability of digital tools, many classrooms still depend on roll calls and paper registers. A teacher must call names, verify responses, and later transfer information to a spreadsheet or record book. This routine reduces teaching time and can introduce transcription errors.")
    add_text(doc, "Face recognition provides a contactless alternative because the face is a naturally available biometric trait. A camera frame can be processed to locate faces, create numerical feature vectors, and compare these vectors with registered student representations. When combined with a database and clear attendance rules, the process can produce traceable attendance records without requiring a student to sign a sheet or carry a card.")
    add_text(doc, "The project applies this idea to a classroom-oriented web application. It is not limited to a single person standing at a terminal. The multi-face feature accepts a classroom frame, detects several visible faces, displays a box around each detected face, identifies active registered students, and records attendance for each unique match.")
    add_heading(doc, "1.2 Problem Statement", 2)
    add_text(doc, "Manual attendance methods are slow, prone to human error, and difficult to verify retrospectively. RFID cards and QR codes reduce manual work but can still be shared or scanned by another person. A practical system is needed to identify students from their faces, maintain subject-wise records, prevent duplicate marking, support corrections with a reason, and provide reports for faculty and administrators.")
    add_heading(doc, "1.3 Objectives", 2)
    for item in [
        "Develop a secure web application for managing student attendance.",
        "Register student details and face encodings through webcam samples or a clear uploaded portrait.",
        "Detect and recognize one or more faces in a live classroom frame.",
        "Automatically create attendance records for recognized, active students while preventing duplicates.",
        "Provide subject, session, reporting, export, audit, backup, and correction facilities.",
        "Offer a manual attendance fallback when recognition is not possible.",
    ]: add_bullet(doc, item)
    add_heading(doc, "1.4 Scope of the Project", 2)
    add_text(doc, "The system is intended for department-level or college-level attendance management. It manages students, subjects, attendance sessions, facial samples, encodings, and reports. A faculty user can begin an active class session, select a subject, start a webcam, and allow the application to scan the class periodically. The project also supports photo-based face registration so that a clear portrait can be used when a live webcam capture is unavailable.")
    add_text(doc, "The current scope focuses on authenticated administration and student attendance. It does not attempt to replace a full university ERP system, enforce liveness detection, or provide a separate faculty attendance module. Such additions are identified under future scope.")
    add_heading(doc, "1.5 Methodology", 2)
    add_text(doc, "The project follows an incremental development methodology. Requirements were identified from common classroom attendance problems. The system was divided into independent modules for authentication, students, face registration, recognition, attendance, reports, settings, and audit records. Each module was implemented and tested independently before integration.")
    add_table(doc, ["Stage", "Activity", "Output"], [
        ["Requirement analysis", "Identify actors, attendance rules, data fields, and reports", "Functional and non-functional requirements"],
        ["Design", "Define architecture, database entities, APIs, and screen navigation", "System design and data model"],
        ["Implementation", "Build frontend, backend, computer-vision pipeline, and database services", "Working web application"],
        ["Testing", "Validate APIs, workflows, duplicate prevention, multi-face response, and browser navigation", "Verified test results"],
        ["Deployment preparation", "Configure virtual environment, startup process, backup, and documentation", "Runnable local project"],
    ], [1.2, 3.4, 2.0])

    # Chapter 2
    chapter(doc, 2, "Literature Review")
    add_heading(doc, "2.1 Introduction", 2)
    add_text(doc, "Biometric attendance systems use physical or behavioural traits such as fingerprints, iris patterns, voice, and facial appearance. Face recognition is attractive in classroom settings because it is contactless and can operate through an ordinary camera. Modern deep-learning-based face systems typically use three stages: detection, alignment and feature extraction, followed by similarity matching against enrolled templates.")
    add_heading(doc, "2.2 Review of Existing Systems", 2)
    add_table(doc, ["System Type", "Working Method", "Strengths", "Limitations"], [
        ["Manual register", "Teacher calls names or records signatures", "No special equipment", "Slow, error-prone, difficult to audit"],
        ["RFID or smart card", "Student taps an assigned card", "Fast individual verification", "Cards can be shared or lost; requires reader hardware"],
        ["QR code attendance", "Student scans a QR code using a phone", "Low setup cost", "Can allow remote sharing or proxy scanning"],
        ["Fingerprint attendance", "Student touches biometric reader", "Strong identity association", "Queues, contact hygiene, dedicated hardware"],
        ["Early face-recognition systems", "Haar features or classical embeddings", "Contactless operation", "Sensitive to pose, lighting, and image quality"],
        ["Modern face-recognition systems", "Deep embeddings and similarity matching", "Better robustness and multi-face capability", "Needs quality enrollment, privacy controls, and computing resources"],
    ], [1.3, 1.7, 1.8, 2.0])
    add_text(doc, "Classical approaches such as Eigenfaces and Local Binary Patterns contributed to early research but were often affected by lighting and pose variation. Deep embedding approaches represent a face as a compact numeric vector. Matching becomes a comparison between embeddings rather than a direct pixel comparison. This project uses the OpenCV YuNet detector and SFace embedding model because they are suitable for an educational local deployment and work with the Python application stack.")
    add_heading(doc, "2.3 Research Gap", 2)
    add_text(doc, "Many small attendance projects demonstrate face recognition for one person at a time but do not address the surrounding operational needs of a real attendance workflow. Common gaps include duplicate prevention, session controls, correction history, active/inactive student status, exportable records, auditability, and multi-face processing. Other systems may require expensive specialized hardware or a cloud service that is not suitable for a college project demonstration.")
    add_text(doc, "The proposed work addresses these gaps by combining face recognition with a complete web-based attendance workflow. It integrates subject and session context, records recognition metadata, provides manual fallback, maintains correction history, offers reporting, and supports multiple faces in one frame. The design also excludes inactive students from recognition and reduces duplicate face detections of the same student within a frame.")
    add_heading(doc, "2.4 Summary", 2)
    add_text(doc, "The review indicates that face recognition is most useful when it is treated as one part of a controlled attendance process rather than as an isolated image-classification task. The proposed system therefore combines computer vision with database rules, authenticated workflows, and reporting functions.")

    # Chapter 3
    chapter(doc, 3, "System Analysis and Design")
    add_heading(doc, "3.1 Existing System", 2)
    add_text(doc, "In a conventional system, an instructor records attendance manually and later prepares reports from separate records. The process depends heavily on the teacher's attention and offers limited evidence of how a record was created. Card and QR systems improve speed but do not always establish that the card holder or phone owner is physically present.")
    add_heading(doc, "3.2 Proposed System", 2)
    add_text(doc, "The proposed system provides a browser-based interface connected to a FastAPI service. An administrator records student details, uploads a photo or captures face samples, and generates an encoding. During a class, the system captures a camera frame, detects up to twenty face candidates, compares their embeddings with active student encodings, and displays live bounding boxes. Each unique recognized student is submitted to the attendance service, which validates the selected subject and active session before recording attendance.")
    add_heading(doc, "3.3 Requirements", 2)
    add_table(doc, ["Category", "Requirement"], [
        ["Functional", "Admin login, student CRUD, face registration, single and multi-face recognition, attendance marking, sessions, reports, exports, audit logs, backup and restore."],
        ["Hardware", "Computer with webcam, minimum 4 GB RAM, dual-core processor or better, and stable local storage."],
        ["Software", "Windows/Linux, Python 3.12 or compatible version, Node.js, modern browser, FastAPI, React, OpenCV, SQLite."],
        ["Security", "JWT-protected APIs, password hashing, validated uploads, active-student filtering, and audit records."],
        ["Usability", "Responsive browser interface, webcam selection, manual fallback, confidence display, and explanatory status messages."],
        ["Performance", "Face frame processing suitable for periodic classroom scanning; default automatic scan interval is three seconds."],
    ], [1.35, 5.45])
    add_heading(doc, "3.4 System Architecture and Block Diagram", 2)
    add_text(doc, "The system uses a client-server architecture. The frontend handles user interaction, camera access, and visual presentation. The backend exposes REST APIs for authentication, data management, recognition, attendance, reports, and settings. SQLite stores transactional data, while face sample images and encoding files are stored on the local file system.")
    add_table(doc, ["Layer", "Main Components", "Responsibility"], [
        ["Presentation layer", "React, Vite, Axios, browser webcam", "Login, forms, camera capture, bounding boxes, dashboard, records, reports"],
        ["API layer", "FastAPI routers and Pydantic schemas", "Validates requests and exposes REST endpoints"],
        ["Business layer", "Attendance, student, report, audit services", "Applies attendance rules, duplicate checks, filters, exports"],
        ["Recognition layer", "OpenCV YuNet and SFace", "Detects faces, extracts embeddings, compares similarities"],
        ["Persistence layer", "SQLite, SQLAlchemy, file storage", "Stores users, students, subjects, sessions, attendance, samples, encodings"],
    ], [1.35, 2.5, 2.95])
    add_text(doc, "Figure 3.1 Block Diagram")
    diagram = doc.add_table(rows=1, cols=5)
    diagram.alignment = WD_TABLE_ALIGNMENT.CENTER
    labels = ["Web Browser\nReact UI", "FastAPI\nREST API", "Recognition Engine\nYuNet and SFace", "Business Services\nAttendance and Reports", "SQLite and File Storage"]
    for i, label in enumerate(labels):
        cell = diagram.cell(0, i)
        set_cell_shading(cell, "DCE6F1")
        set_cell_border(cell, "9FBAD0")
        set_cell_margin(cell, 180, 80, 180, 80)
        p = cell.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_font(p.add_run(label), size=9.5, bold=True)
    add_text(doc, "Data flow: camera frame -> multi-face detection -> SFace embeddings -> similarity matching -> attendance validation -> persistent record -> dashboard and reports.")
    add_heading(doc, "3.5 Flowchart and Methodology", 2)
    add_table(doc, ["Step", "Process", "Decision / Result"], [
        ["1", "Administrator logs in", "JWT token authorizes protected operations"],
        ["2", "Student is registered", "Photo or webcam samples are stored"],
        ["3", "Face encoding is generated", "Embedding is saved for the active student"],
        ["4", "Faculty selects subject/session and starts camera", "Frame is captured every three seconds"],
        ["5", "YuNet detects face candidates", "Up to twenty candidates are retained"],
        ["6", "SFace generates embeddings and compares them", "Recognized / unknown result and confidence are returned"],
        ["7", "Attendance service validates each match", "Rejects inactive, duplicate, invalid-session, or subject-mismatch records"],
        ["8", "Result is displayed", "Live boxes, status list, audit record, dashboard and reports are updated"],
    ], [0.55, 3.4, 2.85])

    # Chapter 4
    chapter(doc, 4, "Implementation")
    add_heading(doc, "4.1 Implementation Process", 2)
    add_text(doc, "The frontend was implemented as a React single-page application with route-based pages for login, students, face registration, attendance, sessions, records, subjects, reports, settings, and audit logs. Axios is used to call the backend APIs and attach the authentication token. The camera interface uses the browser MediaDevices API to obtain a selected webcam stream and a canvas element to capture JPEG frames.")
    add_text(doc, "The backend was implemented using FastAPI. Routers separate responsibilities such as authentication, students, face processing, attendance, subjects, sessions, reports, settings, and audit logs. SQLAlchemy maps database tables to Python models. Pydantic request models validate attendance and configuration data. The system stores face samples in a file directory and stores normalized face embeddings as pickle files linked to student IDs.")
    add_text(doc, "For recognition, the captured frame is decoded by OpenCV. YuNet locates faces and returns bounding box coordinates. SFace aligns each detected face and creates a feature vector. Cosine similarity is calculated between the live feature and each registered active student encoding. A confidence value is returned to the user interface. The multi-face API removes duplicate matches for the same student in a frame and returns each face box for visual feedback.")
    add_heading(doc, "4.2 Hardware and Software Implementation", 2)
    add_table(doc, ["Component", "Implementation"], [
        ["Client device", "Desktop or laptop with a webcam and modern web browser"],
        ["Frontend", "React 18, Vite, React Router, Axios, Recharts, Lucide icons, React Hot Toast"],
        ["Backend", "Python, FastAPI, Uvicorn, Pydantic, SQLAlchemy"],
        ["Database", "SQLite database with tables for admins, students, subjects, sessions, attendance, corrections, settings, and audit logs"],
        ["Computer vision", "OpenCV FaceDetectorYN with YuNet model and FaceRecognizerSF with SFace model"],
        ["Reports", "Pandas and OpenPyXL for CSV and Excel export"],
        ["Security", "JWT using python-jose and password hashing using passlib/bcrypt"],
    ], [1.6, 5.2])
    add_heading(doc, "4.3 Modules and Components", 2)
    modules = [
        ("Authentication Module", "Provides secure administrator login, token-based access control, current-user retrieval, logout, and password protection."),
        ("Student Management Module", "Creates, updates, lists, searches, activates/deactivates, and views student profiles. It supports photo upload and bulk import."),
        ("Face Registration Module", "Captures webcam samples or accepts one uploaded portrait. The uploaded portrait can replace previous samples and automatically generate a face encoding."),
        ("Recognition Module", "Uses YuNet to detect faces and SFace to create embeddings. It supports one-face recognition and multi-face processing with up to twenty candidates."),
        ("Attendance Module", "Marks present attendance, prevents duplicate records, validates active sessions and subjects, stores confidence and recognition method, and supports manual fallback."),
        ("Session and Subject Module", "Manages subjects and controlled class sessions. A session can be created, started, completed, or cancelled."),
        ("Records and Correction Module", "Filters attendance records and preserves correction history with old status, new status, reason, user, and timestamp."),
        ("Reports and Dashboard Module", "Shows daily statistics, weekly trends, recent attendance, daily/monthly/student reports, and export to CSV or Excel."),
        ("Settings and Audit Module", "Configures recognition settings, manages backups, restores saved databases, and records significant administrative actions."),
    ]
    add_table(doc, ["Module", "Description"], modules, [1.7, 5.1])

    # Chapter 5
    chapter(doc, 5, "Testing and Results")
    add_heading(doc, "5.1 Testing", 2)
    add_text(doc, "Testing was performed at API, workflow, and browser levels. The backend test suite verifies authentication, student operations, subject management, dashboard statistics, settings, attendance validation, reports, exports, backups, session-controlled attendance, correction history, and audit records. Multi-face tests verify that the detector is configured to retain multiple face candidates and that duplicate detections of the same student are reduced to one recognized result.")
    add_table(doc, ["Test Case", "Expected Result", "Outcome"], [
        ["Login with valid credentials", "JWT token is issued and protected pages become accessible", "Pass"],
        ["Create and update student", "Student data and optional photo are stored", "Pass"],
        ["Photo-based face registration", "Uploaded portrait is saved as a sample and encoding is generated", "Pass"],
        ["Inactive student recognition", "Inactive student is excluded from matching", "Pass"],
        ["Duplicate attendance", "Second record for same student, subject, and date is rejected", "Pass"],
        ["Inactive session attendance", "Attendance is rejected until session is started", "Pass"],
        ["Multi-face response", "Multiple detected faces are returned; duplicate identity is retained once", "Pass"],
        ["Four-face detector frame", "YuNet detects four face candidates in a composite test frame", "Pass"],
        ["Attendance correction", "Correction reason and history are recorded", "Pass"],
        ["CSV and Excel exports", "Filtered attendance data is downloaded in selected format", "Pass"],
        ["Browser smoke test", "Login, dashboard, sessions, records, reports, and audit-log navigation work", "Pass"],
    ], [1.65, 3.75, 1.1])
    add_heading(doc, "5.2 Results and Outcomes", 2)
    add_text(doc, "The completed system successfully demonstrates a complete attendance workflow. Students can be registered with their details and photo. A face encoding can be created from captured samples or a single uploaded portrait. During attendance, the system scans the camera frame, detects each visible face, and displays a coloured box with name and confidence for recognized students. Unknown faces are also shown so that the operator can understand why they were not marked.")
    add_text(doc, "The multi-face implementation was verified with a frame containing four face instances; the detector returned four face candidates. The implementation keeps up to twenty face candidates in a frame. In normal classroom usage, a smaller group of approximately four to ten students is recommended for better face size, lighting, and non-overlap. Attendance is created only for active registered students and is protected by duplicate checks.")
    add_heading(doc, "5.3 Performance Analysis", 2)
    add_text(doc, "Performance depends on camera resolution, available CPU resources, lighting, number of faces, and the number of registered encodings. The system uses periodic scanning rather than attempting to process every video frame. The default scan interval is three seconds, which avoids excessive resource usage while giving the class sufficient time to be observed. Detection quality improves when faces are front-facing, evenly lit, and large enough in the frame.")
    add_table(doc, ["Metric", "Observed / Configured Behaviour", "Interpretation"], [
        ["Face candidate limit", "20 faces per captured frame", "Supports classroom grouping while limiting unnecessary candidates"],
        ["Recommended practical group", "4 to 10 visible students", "Improves face size and reduces overlap"],
        ["Automatic scan interval", "3 seconds", "Balances responsiveness and local processing cost"],
        ["Duplicate prevention", "Per student, subject, and date", "Prevents repeat marking during repeated scans"],
        ["Recognition eligibility", "Active students with valid encodings", "Protects record integrity"],
        ["Test suite", "30 backend tests passed", "Confirms core API and workflow behaviour"],
    ], [1.55, 2.65, 2.3])

    # Chapter 6
    chapter(doc, 6, "Conclusion and Future Scope")
    add_heading(doc, "6.1 Conclusion", 2)
    add_text(doc, "Attendance Monitoring Using Face Recognition for Students provides an integrated solution for classroom attendance. It combines face detection and recognition with secure authentication, structured student records, subject and session controls, attendance validation, correction history, reporting, and auditability. The application reduces dependence on manual roll calls while preserving a manual option for exceptional cases.")
    add_text(doc, "The project demonstrates that face recognition can be applied effectively when it is accompanied by operational controls. The multi-face workflow is a key outcome: it detects multiple faces in a classroom frame, displays a live box for each face, identifies unique active students, and marks their attendance only after database rules are satisfied. The photo-based enrolment option also makes registration easier when a webcam session is unavailable.")
    add_heading(doc, "6.2 Limitations", 2)
    for item in [
        "Recognition quality depends on lighting, facial pose, camera quality, distance, and the quality of enrollment photographs.",
        "A single photograph can create an encoding, but multiple varied samples generally provide stronger recognition accuracy.",
        "The current implementation is intended for local or small-scale deployment using SQLite and local file storage.",
        "The system does not currently include liveness detection, so a dedicated anti-spoofing method would be required for high-security deployment.",
        "Very crowded frames can reduce face size and increase the chance of occlusion or missed detection.",
    ]: add_bullet(doc, item)
    add_heading(doc, "6.3 Future Scope", 2)
    for item in [
        "Add liveness detection and anti-spoofing checks to reduce photograph or screen replay attacks.",
        "Introduce faculty accounts, role-based access control, and a dedicated faculty attendance module.",
        "Migrate from SQLite to PostgreSQL and add centralized object storage for larger deployments.",
        "Provide student and parent portals with attendance percentage notifications.",
        "Add timetable integration, leave requests, approval workflow, and automatic absence reporting.",
        "Use asynchronous queues or GPU acceleration for larger classroom or campus-wide processing.",
        "Add multilingual support, mobile-friendly progressive web application support, and PDF report export.",
    ]: add_bullet(doc, item)

    # References
    doc.add_page_break()
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run("REFERENCES"), size=16, bold=True)
    refs = [
        "P. Viola and M. Jones, Robust Real-Time Face Detection, International Journal of Computer Vision, 2004.",
        "F. Schroff, D. Kalenichenko and J. Philbin, FaceNet: A Unified Embedding for Face Recognition and Clustering, CVPR, 2015.",
        "Y. Zhong et al., SFace: Sigmoid-Constrained Hypersphere Loss for Robust Face Recognition, IEEE Transactions on Pattern Analysis and Machine Intelligence, 2021.",
        "OpenCV Documentation, FaceDetectorYN and FaceRecognizerSF APIs, Open Source Computer Vision Library.",
        "FastAPI Documentation, FastAPI framework for building APIs with Python.",
        "React Documentation, React library for user interfaces.",
        "SQLAlchemy Documentation, SQL toolkit and object-relational mapper for Python.",
        "OWASP Foundation, Authentication and Session Management guidance, OWASP resources.",
    ]
    for i, ref in enumerate(refs, 1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.first_line_indent = Inches(-0.25)
        p.paragraph_format.space_after = Pt(8)
        set_font(p.add_run(f"[{i}] {ref}"), size=11)

    doc.core_properties.title = "Attendance Monitoring Using Face Recognition for Students Project Report"
    doc.core_properties.author = "[STUDENT NAME]"
    doc.save(OUT)
    print(OUT.resolve())


if __name__ == "__main__":
    build_report()
