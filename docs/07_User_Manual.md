# USER MANUAL

**Project:** Attendance Monitoring System Using Face Recognition for Students  
**Version:** 1.0 | **Date:** August 2025  
**Audience:** Admin / Faculty (End User)

---

## CHAPTER 1: INTRODUCTION

### 1.1 About This Manual
This user manual provides step-by-step instructions for using the Attendance Monitoring System. It covers every feature of the system in simple language with clear instructions.

### 1.2 System Overview
The Attendance Monitoring System automates student attendance using **facial recognition technology**. Instead of calling out names one by one, the system uses a webcam to automatically identify students and mark their attendance in seconds.

### 1.3 Key Features
- ✅ **Automatic face recognition** via webcam
- ✅ **Student database** — add, edit, delete students
- ✅ **One-click reports** — daily, monthly, student-wise
- ✅ **Export** attendance to Excel or CSV
- ✅ **Live dashboard** with today's stats
- ✅ **Multi-webcam support** — choose your camera

### 1.4 System Requirements
| Requirement | Minimum |
|-------------|---------|
| Operating System | Windows 10, macOS 10.15, Ubuntu 20.04 |
| Web Browser | Chrome 90+, Firefox 88+, Edge 90+ |
| Webcam | Any USB or built-in webcam (640×480 min) |
| RAM | 4 GB (8 GB recommended) |
| Storage | 2 GB free space |
| Internet | Not required after setup |

---

## CHAPTER 2: GETTING STARTED

### 2.1 Starting the System

**Step 1 — Start the Backend Server:**
1. Open a Command Prompt (Win + R → type cmd → Enter)
2. Type the following commands:
```
cd "C:\Users\YourName\Desktop\Attendance Monitoring using Face Recognition for Students\backend"
venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000
```
3. Wait until you see: `Uvicorn running on http://127.0.0.1:8000`

**Step 2 — Start the Frontend:**
1. Open a NEW Command Prompt window
2. Type:
```
cd "C:\Users\YourName\Desktop\Attendance Monitoring using Face Recognition for Students\frontend"
npm run dev
```
3. Wait for: `VITE ready in ... ms` and note the URL (usually http://localhost:5173)

**Step 3 — Open in Browser:**
1. Open Google Chrome
2. Go to: `http://localhost:5173`
3. The Login page will appear

> ⚠️ **Important:** Keep both Command Prompt windows open while using the system. Closing them will stop the system.

---

### 2.2 Login

![Login Page]

1. On the Login page, enter:
   - **Username:** `admin`
   - **Password:** `admin123`
2. Click the **Login** button
3. You will be taken to the **Dashboard**

**Quick Login:** Click the **"Login with Admin Account"** button to auto-fill and login in one click.

> 🔒 The system uses secure JWT authentication. Your session stays active for 24 hours.

---

### 2.3 Navigation

The **left sidebar** contains all navigation links:

| Menu Item | Purpose |
|-----------|---------|
| 🏠 Dashboard | View today's overview |
| 👥 Students | Manage student records |
| 📷 Face Registration | Register student faces |
| 🎥 Take Attendance | Mark attendance via webcam |
| 📋 Attendance Records | View and export records |
| 📚 Subjects | Manage subjects |
| 📊 Reports | Generate attendance reports |
| ⚙️ Settings | System configuration |
| 🚪 Logout | End your session |

---

## CHAPTER 3: DASHBOARD

The Dashboard is your **home screen** showing a summary of today's activity.

### 3.1 Understanding the Dashboard

**Stat Cards (top row):**
| Card | Color | What it Shows |
|------|-------|--------------|
| Total Students | Blue | Total registered students |
| Present Today | Green | Students marked present today |
| Absent Today | Red | Students absent today |
| Attendance % | Purple | Today's attendance percentage |

> 💡 **Tip:** Click any stat card to navigate to the detailed view (e.g., clicking "Present Today" takes you to attendance records filtered by Present).

**Recent Attendance Table:**  
Shows the last 8 attendance records with Student ID, Name, Department, Time, and Status.

**Quick Actions (right panel):**
| Button | Action |
|--------|--------|
| Register Student | Go to student registration form |
| Capture Face | Go to face registration |
| Take Attendance | Start the attendance camera |
| Generate Report | Go to reports page |

---

## CHAPTER 4: STUDENT MANAGEMENT

### 4.1 Viewing Students

1. Click **Students** in the sidebar
2. The students list shows all registered students in a table
3. **Stat cards** at the top show counts by gender and department

### 4.2 Searching for a Student

1. In the search box, type a **Student ID** or **Name**
2. Click **Search** button (or press Enter)
3. Results appear below

**Filtering:**
- Use the **Department**, **Course**, **Semester**, **Section** dropdowns
- Click **Search** to apply filters
- Click **Reset** to clear all filters and show all students

### 4.3 Adding a New Student

1. Click the **"+ Add Student"** button (top right)
2. Fill in the registration form:

| Field | Required | Example |
|-------|----------|---------|
| Student ID | ✅ Yes | STU001 |
| Full Name | ✅ Yes | Rahul Kumar |
| Gender | No | Male |
| Date of Birth | No | 2003-05-15 |
| Department | No | Computer Science |
| Course | No | BCA |
| Semester | No | 6 |
| Section | No | A |
| Phone | No | 9876543210 |
| Email | No | rahul@college.edu |
| Address | No | Mumbai, India |
| Photo | No | Upload a photo |

3. Click **Register Student**
4. A success message will appear

> ⚠️ **Student ID must be unique.** If a student with the same ID already exists, an error will appear.

### 4.4 Editing a Student

1. Find the student in the list
2. Click the **blue pencil icon** (✏️) in the Action column
3. Modify the fields you need to change
4. Click **Update Student**

### 4.5 Deleting a Student

1. Click the **red trash icon** (🗑️) next to a student
2. A confirmation dialog appears: "Delete student STU001?"
3. Click **OK** to confirm deletion
4. Click **Cancel** to keep the student

> ⚠️ **Warning:** Deleting a student also removes all their attendance records. This cannot be undone.

### 4.6 Navigating Pages

- Use the **page numbers** at the bottom to navigate
- The system shows 8 students per page
- **«** = First page | **‹** = Previous | **›** = Next | **»** = Last

---

## CHAPTER 5: FACE REGISTRATION

Face registration is **required before taking attendance**. Each student needs their face captured so the system can recognize them.

### 5.1 Opening Face Registration

1. Click **Face Registration** in the sidebar  
   OR click **Capture Face** on the Dashboard

### 5.2 Step-by-Step: Register a Student's Face

**Step 1 — Load the Student:**
1. In the "Enter Student ID" box, type the Student ID (e.g., STU001)
2. Click **Load Student**
3. The student's name and details appear on the right

**Step 2 — Select Webcam:**
1. In the **"📷 Webcam Device"** dropdown, select your webcam
2. If only one webcam is connected, it is auto-selected
3. Click **"Refresh Devices"** if a newly connected camera isn't showing

**Step 3 — Start Camera:**
1. Click **"Start Camera"** button
2. A live video feed from your webcam appears
3. Position the student's face in the camera frame

**Step 4 — Capture 10 Samples:**
1. Ask the student to look directly at the camera
2. Click **"Capture Sample"** button
3. The counter updates: "1/10", "2/10" ... "10/10"
4. The colored squares at the right turn green for each capture

> 💡 **Tips for good samples:**
> - Take samples from slightly different angles (left, right, straight)
> - Ensure good lighting (no strong backlight)
> - Student should not wear sunglasses
> - Keep the face centered in the frame

**Step 5 — Generate Encoding:**
1. After capturing samples (minimum 3, recommended 10), click **"Generate Encoding"**
2. Wait 5–15 seconds while the system processes
3. A green success message appears: **"Face Encoding Generated Successfully!"**
4. The student is now registered for facial recognition ✅

### 5.3 Retaking Samples

If the captured samples are blurry or incorrect:
1. Click **"Retake"** button
2. All samples are cleared (counter resets to 0/10)
3. Capture new samples and generate encoding again

### 5.4 Changing Student

1. Click **"Change Student"** button (bottom of right panel)
2. The student is unloaded; enter a new Student ID

---

## CHAPTER 6: TAKING ATTENDANCE

### 6.1 Overview
The Take Attendance page uses your webcam to **automatically identify students** and mark their attendance. The camera scans every 3 seconds.

### 6.2 Step-by-Step: Mark Attendance

**Step 1 — Go to Take Attendance:**
1. Click **Take Attendance** in the sidebar  
   OR click **Take Attendance** on the Dashboard

**Step 2 — Select Webcam:**
1. In the **"📷 Webcam Device"** dropdown, select your webcam
2. If only one webcam is connected, it is auto-selected

**Step 3 — Select Subject (Optional):**
1. In the **Subject** dropdown, select the class subject
2. Leave blank for general attendance

**Step 4 — Start Camera:**
1. Click the green **"Start Camera"** button
2. Live video feed appears
3. The system begins scanning every 3 seconds automatically
4. A "Scanning..." indicator shows when it's processing

**Step 5 — Recognition:**
When a student is recognized:
- Their **name and ID appear as an overlay** on the camera feed (green label)
- The **Recognition Info panel** fills with their details:
  - Student ID
  - Student Name
  - Department
  - Match Confidence (e.g., 92.45%)
  - Status: Present
  - Date & Time

**Step 6 — Attendance Marked:**
- A green success message: **"Recognized Successfully and Attendance Marked!"**
- **"✓ Attendance Marked"** text appears below the info panel
- The record is saved to the database

**Step 7 — Next Student:**
The camera continues scanning. The next student can approach the camera.

**Step 8 — Stop Camera:**
1. When all students are done, click **"Stop Camera"**
2. The video feed stops; scanning stops

### 6.3 Understanding Recognition Results

| Message | Meaning |
|---------|---------|
| ✅ "Attendance Marked!" | Face recognized; attendance saved |
| ⚠️ "Already marked today" | Student already marked present today; no duplicate |
| ❌ "Face not recognized" | Face not in system; student needs face registration |

### 6.4 For Best Results
- Good, even lighting on the student's face
- Student should look directly at the camera
- Keep distance: 50–150 cm from camera
- Camera should be at face height
- Avoid strong backlight (window behind student)

---

## CHAPTER 7: ATTENDANCE RECORDS

### 7.1 Viewing Records

1. Click **Attendance Records** in the sidebar
2. All attendance records are shown in a table (10 per page)

**Table columns:**
- **ID** — Record number
- **Student ID** — Student's ID
- **Name** — Student's full name
- **Department**
- **Subject** — Subject (if linked)
- **Date** — Attendance date
- **Time** — Time of recognition
- **Status** — 🟢 Present / 🔴 Absent

### 7.2 Filtering Records

Use the filter bar at the top:

| Filter | How to Use |
|--------|-----------|
| Date From | Select start date |
| Date To | Select end date |
| Department | Choose from dropdown |
| Status | Select Present or Absent |

1. Set your filters
2. Click **Search** to apply
3. Click **Reset** to clear all filters

### 7.3 Exporting Records

**Export to Excel:**
1. Apply desired filters
2. Click **Export Excel** (green button)
3. An `.xlsx` file downloads automatically

**Export to CSV:**
1. Apply desired filters
2. Click **Export CSV** (blue button)
3. A `.csv` file downloads automatically

### 7.4 Deleting Records

**Delete selected records:**
1. Check the boxes next to records you want to delete
2. Use the **top checkbox** (in header) to select all on current page
3. Click **"Delete Selected (X)"** (red button)
4. Confirm in the dialog

> ⚠️ **Deleted records cannot be recovered.** Create a backup first if needed.

**Refresh:**
Click **Refresh** (grey button) to reload the latest records from the server.

---

## CHAPTER 8: SUBJECT MANAGEMENT

### 8.1 Viewing Subjects

1. Click **Subjects** in the sidebar
2. All subjects are shown with stat cards at the top

**Stat cards:** Total Subjects | Departments | Active | Inactive

### 8.2 Adding a Subject

1. Click **"+ Add Subject"** button
2. Fill in the modal:
   - **Subject Code** (required): e.g., CS601
   - **Subject Name** (required): e.g., Python Programming
   - **Department**: e.g., Computer Science
   - **Semester**: e.g., 6
   - **Faculty**: e.g., Dr. Sharma
   - **Active Subject**: ✅ checked = active
3. Click **Add Subject**

### 8.3 Editing / Deleting Subjects

- **Edit**: Click the blue pencil icon → modify → click Update
- **Delete**: Click red trash icon → confirm

### 8.4 Active vs Inactive Subjects

- **Active** (green badge): Subject appears in attendance subject dropdown
- **Inactive** (red badge): Subject is archived but records are kept

---

## CHAPTER 9: REPORTS

### 9.1 Generating a Report

1. Click **Reports** in the sidebar
2. Select a **Report Type** using the radio buttons:
   - **Daily Report** — attendance for one day
   - **Monthly Report** — attendance for a whole month
   - **Student Report** — one student's attendance history
   - **Subject Report** — attendance for a specific subject
3. Select a **Date** from the date picker
4. Click **Generate** button

### 9.2 Reading the Report

**Stat cards shown:**
- Total Students counted
- Present count (green)
- Absent count (red)
- Attendance Percentage (purple)

**Pie Chart:**
- Green segment = Present
- Red segment = Absent
- Percentages shown on each segment

---

## CHAPTER 10: SETTINGS

### 10.1 Application Settings

1. Click **Settings** in the sidebar
2. Configure:

| Setting | Description | Default |
|---------|-------------|---------|
| Application Name | Display name of the system | Attendance Monitoring System |
| Recognition Threshold (%) | Minimum confidence for a match | 70% |
| Camera Index | Which camera to use (0=first) | 0 |
| Camera Resolution | Video capture resolution | 640 x 480 |
| Theme | UI theme | Dark |

3. Click **Save Settings** (green button)

> 💡 **Recognition Threshold Guide:**
> - **60–65%**: More sensitive, may cause false matches
> - **70%**: Recommended balance
> - **80–90%**: Very strict, may miss some matches

### 10.2 Database Backup

1. Click **"Backup Now"** (blue button)
2. A backup copy of the database is created
3. Success message confirms backup

> 💡 **Best Practice:** Create a backup before major operations (deleting students, restoring database).

### 10.3 Database Restore

1. Click **"Choose file"** in the Restore section
2. Select your `.db` backup file
3. Click **Restore** (orange button)
4. Confirm the restore operation

> ⚠️ **Warning:** Restoring a database overwrites all current data with the backup data.

---

## CHAPTER 11: TROUBLESHOOTING

### 11.1 Camera Not Working

| Problem | Solution |
|---------|---------|
| "No webcam detected" | Connect webcam; click Refresh Devices |
| "Camera permission denied" | Go to browser settings → Allow camera for localhost |
| Black screen | Try a different webcam from dropdown |
| Blurry image | Clean camera lens; improve lighting |

**Allowing Camera in Chrome:**
1. Click the 🔒 lock icon in the address bar
2. Click "Site settings"
3. Set Camera to "Allow"
4. Refresh the page

### 11.2 Face Not Recognized

| Problem | Solution |
|---------|---------|
| Student not recognized | Re-register face with better samples |
| Low confidence score | Ensure good lighting; remove glasses |
| Wrong student recognized | Increase recognition threshold in Settings |
| "No face detected" | Move face closer to camera; improve lighting |

### 11.3 Login Issues

| Problem | Solution |
|---------|---------|
| "Invalid credentials" | Check username: admin, password: admin123 |
| Page not loading | Ensure both backend and frontend servers are running |
| Session expired | Login again (sessions last 24 hours) |

### 11.4 Server Not Starting

**Backend error:**
- Ensure Python virtual environment is activated: `venv\Scripts\activate`
- Check port 8000 is free: `netstat -ano | findstr :8000`

**Frontend error:**
- Run `npm install` first
- Check Node.js version: `node --version` (must be 18+)

---

## CHAPTER 12: QUICK REFERENCE

### Keyboard Shortcuts
| Shortcut | Action |
|---------|--------|
| Enter | Submit search form |

### Default Credentials
| Field | Value |
|-------|-------|
| Username | admin |
| Password | admin123 |

### Important URLs
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### Workflow Summary
```
1. Start backend server
2. Start frontend server
3. Login → Dashboard
4. Add Students (Students → Add Student)
5. Register Faces (Face Registration)
6. Take Attendance (Take Attendance → Start Camera)
7. View Records (Attendance Records)
8. Generate Reports (Reports → Generate)
9. Export as Excel/CSV
```

---

*User Manual Version 1.0 | August 2025*  
*For technical support, contact the system administrator.*
