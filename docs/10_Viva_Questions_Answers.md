# VIVA QUESTIONS & ANSWERS

**Project:** Attendance Monitoring System Using Face Recognition for Students  
**Purpose:** Final-year project viva / oral examination preparation  
**Level:** BCA / B.Tech / MCA Final Year

---

## CATEGORY 1: PROJECT OVERVIEW

---

**Q1. What is the title and purpose of your project?**

**A:** My project is "Attendance Monitoring System Using Face Recognition for Students." The purpose is to automate student attendance marking in educational institutions using facial recognition technology. The system uses a webcam to identify students in real time and automatically marks their attendance, eliminating manual roll calls and proxy attendance.

---

**Q2. What motivated you to choose this project?**

**A:** I observed that manual attendance in our college wastes 10–15 minutes per class. With 30+ subjects across departments, this amounts to hundreds of minutes wasted daily institution-wide. Additionally, proxy attendance is a significant problem — students mark absent classmates as present, inflating attendance figures. This project solves both problems simultaneously using accessible technology (webcam + open-source libraries) at virtually zero cost.

---

**Q3. What are the main objectives of your project?**

**A:** The five key objectives are:
1. **Automate attendance** — replace manual roll call with face recognition
2. **Eliminate proxy** — biometric ID cannot be faked
3. **Real-time dashboard** — instant visibility into attendance statistics
4. **Digital records** — searchable, filterable attendance database
5. **Easy reporting** — one-click daily/monthly reports with export to Excel/CSV

---

**Q4. What problem does your project solve?**

**A:** It solves three interconnected problems:
- **Time waste:** Manual roll calls consume 10–15 min/class → our system takes < 30 seconds
- **Proxy attendance:** Cannot be done with face recognition (unique biometric)
- **Administrative burden:** Generating reports manually takes hours → our system does it in 1 click

---

**Q5. What is the scope of your project?**

**A:** The system is a web-based admin application. In scope: student management, face registration, attendance marking, records management, subject management, report generation, and system settings. Out of scope: mobile app, cloud deployment, student-facing portal, and SMS notifications (planned for future scope).

---

## CATEGORY 2: TECHNICAL — FACE RECOGNITION

---

**Q6. Which face recognition algorithm did you use?**

**A:** I used the `face_recognition` Python library, which is built on top of **dlib's deep learning ResNet model** (a 29-layer Residual Neural Network). This model was trained on a large face dataset and achieves **99.38% accuracy on the LFW (Labeled Faces in the Wild) benchmark**. For face detection, it uses the **HOG (Histogram of Oriented Gradients)** algorithm.

---

**Q7. Explain how face recognition works in your system.**

**A:** The system works in two phases:

**Phase 1 — Registration:**
1. Admin captures 10 images of the student via webcam
2. For each image, dlib's HOG detector finds the face region
3. The ResNet model computes a **128-dimensional encoding** (a vector of 128 float numbers) for each image
4. All 10 encodings are **averaged** to create one master encoding
5. This is stored as a JSON string in the student's database record

**Phase 2 — Recognition (real-time):**
1. System captures a webcam frame every 3 seconds
2. Detects any face in the frame using HOG
3. Computes 128D encoding for the detected face
4. Loads all stored encodings from database
5. Computes **Euclidean distance** between unknown encoding and each stored encoding: `d = ||unknown - stored||₂`
6. Finds the stored encoding with minimum distance
7. If `d < (1 - threshold)`, it's a match → student identified
8. Auto-marks attendance and shows result

---

**Q8. What is a face encoding?**

**A:** A face encoding is a **128-dimensional numerical vector** (an array of 128 float numbers) that uniquely represents a face. The dlib ResNet model is trained so that the same person's face always produces similar vectors (small Euclidean distance between them), while different people produce dissimilar vectors (large distance). It's like a numerical fingerprint of the face.

For example: `[0.12, -0.45, 0.78, ..., 0.33]` — 128 numbers.

---

**Q9. What is Euclidean distance and how is it used?**

**A:** Euclidean distance is the straight-line distance between two points in n-dimensional space. In our case:

```
d = √[ (enc1₁-enc2₁)² + (enc1₂-enc2₂)² + ... + (enc1₁₂₈-enc2₁₂₈)² ]
```

Or in Python: `np.linalg.norm(encoding1 - encoding2)`

Two faces are considered a match if: `d < (1 - threshold)`

For threshold = 0.70: match if `d < 0.30`

Smaller distance = more similar faces. Distance 0.0 = perfect match (same face).

---

**Q10. What is the recognition threshold and how do you configure it?**

**A:** The recognition threshold is the minimum confidence level required to declare a face match. It's configurable from 50% to 90% in Settings.

- At **70% (default):** A face must be at least 70% similar to a stored encoding to be recognized
- Lower threshold (60%): More tolerant → may produce false positives
- Higher threshold (85–90%): Very strict → may miss matches in poor conditions

The threshold translates to: `match if euclidean_distance < (1 - threshold/100)`

---

**Q11. What is HOG — Histogram of Oriented Gradients?**

**A:** HOG is a feature descriptor used for object detection (specifically face detection in our system). It:
1. Divides the image into small cells (e.g., 8×8 pixels)
2. In each cell, computes the gradient (direction of intensity change) for each pixel
3. Creates a histogram of gradient directions per cell
4. These histograms represent the local "shape" of the image region
5. A linear SVM classifier trained on face HOG features detects face regions

It's fast, accurate for frontal faces, and doesn't require GPU.

---

**Q12. Why did you use dlib over OpenCV's built-in face recognition?**

**A:** dlib's ResNet-based face recognition is **significantly more accurate** than OpenCV's LBPH (Local Binary Pattern Histogram) or Eigenfaces methods:

| Method | Accuracy | Lighting Robustness |
|--------|----------|---------------------|
| Eigenfaces | ~70% | Poor |
| LBPH | ~85–88% | Moderate |
| dlib ResNet (our system) | ~96–99% | Good |

dlib uses deep learning (trained on millions of faces), while OpenCV's traditional methods use hand-crafted features. The `face_recognition` library also provides a very clean Python API on top of dlib.

---

**Q13. What are the limitations of your face recognition approach?**

**A:**
1. **Lighting dependency:** Accuracy decreases in poor lighting (strong backlight, very dim rooms)
2. **One face at a time:** HOG detection is most reliable for one face per frame
3. **Frontal face required:** Works best for faces looking directly at camera
4. **No liveness detection:** A high-quality photo could potentially fool the system (though unlikely in practice)
5. **Distance sensitivity:** Very far or very close faces may not be detected

---

**Q14. How do you prevent proxy attendance?**

**A:** Proxy attendance is prevented by the biometric nature of the system. Since attendance is marked only when a student's **actual face** is recognized, another student cannot mark attendance on their behalf. A photo or video of the student would theoretically be a concern, but in practice the camera captures live frames and the recognition happens in a classroom setting where such spoofing is impractical. For production use, liveness detection can be added (blink detection, 3D depth sensing).

---

## CATEGORY 3: TECHNICAL — BACKEND

---

**Q15. Why did you choose FastAPI over Django or Flask?**

**A:** 
- **FastAPI vs Django:** Django is a full-stack framework with templates, ORM, admin, etc. For a pure REST API backend, it's overkill. FastAPI is purpose-built for APIs.
- **FastAPI vs Flask:** FastAPI provides automatic API documentation (Swagger UI), async support, and Pydantic validation built-in. Flask requires additional libraries (Flask-RESTful, Marshmallow) to achieve the same.
- **Performance:** FastAPI is one of the fastest Python web frameworks (comparable to Go/NodeJS for I/O-bound tasks)
- **Auto-docs:** FastAPI auto-generates interactive Swagger docs at `/docs` — very useful for development and testing

---

**Q16. What is JWT and how does your system use it?**

**A:** JWT (JSON Web Token) is a compact, stateless token for authentication.

**Structure:** `header.payload.signature`

**How we use it:**
1. Admin logs in with username/password
2. Backend verifies password (bcrypt comparison)
3. Backend creates JWT: `jwt.encode({"sub": admin_id, "exp": datetime + 24h}, SECRET_KEY)`
4. JWT returned to frontend
5. Frontend stores in `localStorage` and sends as `Authorization: Bearer <token>` with every API request
6. Backend validates token signature and expiry on every protected route

If token is expired or invalid → 401 Unauthorized → redirect to login.

**Advantage over sessions:** Stateless — no session storage needed on server.

---

**Q17. How do you secure passwords?**

**A:** Passwords are hashed using **bcrypt** (via Passlib library):

```python
# Hashing (at registration):
hashed = pwd_context.hash("admin123")
# → $2b$12$rQiMJ5... (bcrypt hash)

# Verification (at login):
pwd_context.verify("admin123", stored_hash)
```

Bcrypt is a cryptographic one-way hash function with built-in salt (random data added before hashing to prevent rainbow table attacks). The cost factor (12) makes brute-force attacks computationally expensive. The plaintext password is **never stored** in the database.

---

**Q18. What is SQLAlchemy and why did you use it?**

**A:** SQLAlchemy is a Python ORM (Object-Relational Mapper). It allows us to work with the database using Python objects instead of writing raw SQL.

**Benefits:**
- Define tables as Python classes (models)
- Query using Python: `db.query(Student).filter(Student.department == "CS").all()`
- Database-agnostic: switching from SQLite to PostgreSQL requires changing one connection string
- Handles connection pooling, transactions automatically

---

**Q19. Why SQLite? Wouldn't a larger database be better?**

**A:** SQLite is ideal for this project because:
1. **Zero configuration:** No separate database server to install/run
2. **File-based:** Entire database in one `.db` file — easy to backup and restore
3. **Sufficient scale:** Can handle up to ~50,000 students/records without performance issues (well beyond single-institution needs)
4. **ACID compliant:** Full transaction support

For a production cloud deployment with multiple institutions and high concurrent users, PostgreSQL would be used instead. This is noted in the future scope. SQLAlchemy makes this migration trivial.

---

**Q20. What is the REST API and how does your frontend communicate with the backend?**

**A:** REST (Representational State Transfer) is an architectural style for web services. Our API:
- Uses standard HTTP methods: GET (read), POST (create), PUT (update), DELETE (delete)
- Returns JSON data
- Stateless — each request contains all needed information (JWT token)

**Communication flow:**
1. Frontend (React) uses Axios library to make HTTP requests
2. Axios instance configured with base URL: `http://localhost:8000/api`
3. Request interceptor adds JWT token to every request header
4. Response interceptor handles 401 errors (redirect to login)
5. Backend returns JSON → React renders the data

---

## CATEGORY 4: TECHNICAL — FRONTEND

---

**Q21. Why React.js for the frontend?**

**A:**
- **Component-based:** Reusable UI components (sidebar, stat cards, tables)
- **React Router:** Client-side navigation without page reloads (SPA)
- **State management:** useState, useEffect, useContext for reactive UI
- **Large ecosystem:** Recharts for charts, Axios for API, React Hot Toast for notifications
- **Performance:** Virtual DOM updates only changed elements
- **Industry standard:** Most in-demand frontend skill

---

**Q22. What is the difference between a Single Page Application (SPA) and traditional web app?**

**A:** 
- **Traditional web app:** Every navigation loads a new HTML page from the server (full page reload)
- **SPA (like our React app):** Initial load fetches the full application; subsequent navigation changes only the view without server round-trips. API calls fetch data, and React renders it client-side.

**Benefits of SPA:** Faster navigation, better user experience, less server load. React Router `<Link>` components handle client-side routing.

---

**Q23. How does the webcam work in your web application?**

**A:** The browser's `navigator.mediaDevices.getUserMedia()` API is used:

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { 
    width: { ideal: 1280 },
    deviceId: { exact: selectedDeviceId }  // specific webcam
  }
});
videoElement.srcObject = stream;  // display in <video> tag
```

To capture a frame for recognition:
```javascript
canvas.getContext('2d').drawImage(videoElement, 0, 0);
canvas.toBlob(blob => {
  // send blob to backend API
}, 'image/jpeg', 0.92);
```

To list all webcam devices:
```javascript
const devices = await navigator.mediaDevices.enumerateDevices();
const cameras = devices.filter(d => d.kind === 'videoinput');
```

---

**Q24. What is React Context and how do you use it for authentication?**

**A:** React Context provides a way to share state across components without passing props through every level (prop drilling).

We use `AuthContext` to manage:
- `user` — currently logged-in admin object
- `login(username, password)` — authenticates and stores token
- `logout()` — clears token
- `isAuthenticated` — boolean for route protection

Any component can access auth state using: `const { user, login, logout } = useAuth();`

The `MainLayout` component uses this to protect all routes — if not authenticated, redirects to `/login`.

---

## CATEGORY 5: SYSTEM DESIGN

---

**Q25. Explain the three-tier architecture of your system.**

**A:**
1. **Presentation Tier (Frontend):** React.js SPA running in the browser at `localhost:5173`. Handles UI rendering, webcam access, and API communication. Users interact only with this layer.

2. **Business Logic Tier (Backend):** FastAPI server at `localhost:8000`. Handles authentication, face recognition algorithm, attendance logic, duplicate prevention, report generation. Contains all the "rules" of the system.

3. **Data Tier (Database):** SQLite database file. Stores all persistent data — admins, students, face encodings, attendance records, subjects, settings.

**Why three-tier?** Separation of concerns — each layer can be modified independently. The frontend can be replaced with a mobile app, the database can be switched to PostgreSQL, without changing other layers.

---

**Q26. What tables are in your database and what are their relationships?**

**A:** Five tables:

1. **admins** — stores admin credentials (id, username, hashed_password)
2. **students** — student info + face_encoding (128D vector as JSON string)
3. **subjects** — subject catalog (subject_code, name, department, faculty)
4. **attendance** — records of attendance (student_id FK, subject_id FK, date, time, status, confidence)
5. **app_settings** — system configuration (singleton row)

**Relationships:**
- Students 1:N Attendance (one student has many attendance records)
- Subjects 1:N Attendance (one subject has many attendance records)
- Attendance has foreign keys to both students and subjects

---

**Q27. How do you prevent duplicate attendance records?**

**A:** Before inserting an attendance record, the backend checks:

```python
existing = db.query(Attendance).filter(
    Attendance.student_id == student_id,
    Attendance.date == today_date
).first()

if existing:
    return {"success": False, "already_marked": True}
else:
    new_record = Attendance(student_id=..., date=today, ...)
    db.add(new_record)
    db.commit()
    return {"success": True}
```

This ensures even if the camera scans the same student multiple times in one day, only one attendance record is created.

---

**Q28. What is CORS and why do you need it?**

**A:** CORS (Cross-Origin Resource Sharing) is a browser security mechanism that prevents web pages from making requests to a different domain/port than the one that served the page.

Our frontend is at `localhost:5173` and backend at `localhost:8000` — different ports = different origins. Without CORS configuration, browsers block these requests.

We configure FastAPI to allow requests from frontend origins:
```python
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"]
)
```

---

## CATEGORY 6: TESTING & RESULTS

---

**Q29. How did you test your project?**

**A:** We used multiple testing approaches:

1. **Black Box Testing:** Tested features from user perspective without looking at code — each feature tested by providing inputs and verifying expected outputs

2. **White Box Testing:** Tested internal logic — authentication flow, encoding algorithm, distance calculation

3. **Integration Testing:** Tested frontend-backend communication — API responses, JWT token flow, error handling

4. **Performance Testing:** Measured recognition speed, API response times

5. **Security Testing:** Tested access without token, with expired token, with invalid token

**Total: 46 test cases — 100% pass rate**

---

**Q30. What is the accuracy of your face recognition system?**

**A:** In our testing under standard indoor lighting conditions, the system achieved approximately **95–97% accuracy**. This means out of 100 recognition attempts:
- ~96 correctly identified the student
- ~4 either failed to recognize or (very rarely) misidentified

Accuracy factors:
- **Good lighting:** ~96% accuracy
- **Poor lighting:** ~80% accuracy
- **Glasses:** ~90% accuracy
- **Significant pose change:** ~85% accuracy

This is consistent with published benchmarks for the dlib model under real-world conditions.

---

## CATEGORY 7: FUTURE SCOPE & IMPROVEMENTS

---

**Q31. What are the limitations of your system?**

**A:**
1. Requires good lighting for optimal accuracy
2. Handles one face at a time reliably
3. dlib installation requires C++ build tools on Windows (complex first-time setup)
4. SQLite has single-writer limitation (fine for single-admin but limits scaling)
5. No liveness detection (photo spoofing is theoretically possible)
6. No mobile app
7. No internet/cloud deployment

---

**Q32. What enhancements would you add in the future?**

**A:** Priority enhancements:

1. **Liveness detection:** Use blink detection or 3D depth sensing to prevent photo spoofing
2. **Multi-face recognition:** Recognize multiple students simultaneously using GPU
3. **Mobile app:** React Native or Flutter app for faculty
4. **Parent notifications:** WhatsApp/SMS alert when student is absent
5. **Cloud deployment:** Multi-institution SaaS platform on AWS/Azure
6. **AI analytics:** Machine learning to predict students at risk of short attendance
7. **Student portal:** Students can log in to see their own attendance

---

**Q33. How would you scale this system to handle 10,000+ students?**

**A:**
1. Replace SQLite with **PostgreSQL** (handle concurrent queries)
2. Move to **cloud deployment** (AWS/Azure/GCP)
3. Use **GPU acceleration** for face recognition (NVIDIA CUDA with dlib)
4. Add **Redis caching** for face encodings (avoid DB lookup every scan)
5. Use **load balancing** for multiple backend instances
6. Store face images in **cloud object storage** (S3/GCS)
7. Implement **batch recognition** for large classes

---

**Q34. How does your system compare to commercial attendance systems?**

**A:**
| Feature | Commercial (e.g., eSSL, Suprema) | Our System |
|---------|-----------------------------------|------------|
| Cost | ₹50,000 – ₹5,00,000 | ₹0 (open-source) |
| Installation | Hardware device + software | Webcam + browser |
| Access | Proprietary software | Any web browser |
| Source code | Closed | Open, modifiable |
| Customization | Limited | Full |
| Accuracy | 95–99% | ~96% |
| Reports | Basic | Full (Excel, CSV, charts) |

Our system is significantly more cost-effective and flexible.

---

## CATEGORY 8: GENERAL COMPUTER SCIENCE

---

**Q35. What is machine learning and how does your project use it?**

**A:** Machine learning is a branch of AI where algorithms learn patterns from data without being explicitly programmed. Our project uses **deep learning** (a subset of ML) via the dlib ResNet model:

- The ResNet was **trained** on millions of labeled face images
- It **learned** to extract 128 features that best distinguish different faces
- We **use** this trained model (pre-trained) — we don't train it ourselves
- At inference time, it applies learned patterns to new faces

This is called **transfer learning** — using a pre-trained model for a new task.

---

**Q36. What is a REST API?**

**A:** REST (Representational State Transfer) API is an architectural style for building web services. Key principles:
- **Stateless:** Each request is independent (no server-side session)
- **Resource-based:** URLs represent resources (`/students`, `/attendance`)
- **HTTP methods:** GET (read), POST (create), PUT (update), DELETE (delete)
- **JSON format:** Standard data exchange format

Example: `GET http://localhost:8000/api/students?page=1&limit=8`
Returns: `{"data": [...], "total": 45, "page": 1}`

---

**Q37. What is the difference between authentication and authorization?**

**A:**
- **Authentication:** "Who are you?" — Verifying identity. In our system: login with username/password → JWT token
- **Authorization:** "What can you do?" — Verifying permissions. In our system: all authenticated admins can access all features (single role). In future, could restrict faculty to their own department.

Our system currently: Authentication ✅ | Authorization (single admin role) ✅

---

**Q38. Explain the concept of hashing. Why is bcrypt better than MD5?**

**A:** Hashing is a one-way function that converts input to a fixed-length string. You cannot reverse it (unlike encryption).

**MD5 limitations:**
- Fast computation → easy brute-force
- No salt → rainbow table attacks possible
- Cryptographically broken

**bcrypt advantages:**
- Built-in salt (random per password)
- Adjustable cost factor → makes brute-force slow
- Industry standard for passwords
- `$2b$12$...` → cost factor 12 → ~100ms per hash on modern CPU

**Example:** MD5("admin123") = "0192023a7b..." (same every time, no salt)
bcrypt("admin123") = "$2b$12$rQiMJ5xY..." (different every time, includes salt)

---

**Q39. What is the difference between SQL and NoSQL databases?**

**A:**
| Aspect | SQL (our SQLite) | NoSQL (MongoDB) |
|--------|------------------|-----------------|
| Structure | Tables with fixed schema | Collections with flexible documents |
| Relationships | JOINs between tables | Denormalized/embedded |
| Query language | SQL | MongoDB Query Language |
| ACID | Full ACID | Eventually consistent |
| Best for | Structured data, relations | Flexible, unstructured data |

We chose SQLite (SQL) because our data is highly structured and relational (students ↔ attendance ↔ subjects).

---

**Q40. If you were to redo this project, what would you do differently?**

**A:** Three things:

1. **Use PostgreSQL instead of SQLite** from the start — easier to scale to production without migration

2. **Add GPU support early** — dlib can use CUDA for much faster recognition. Setting this up early would enable real-time multi-face recognition

3. **Add comprehensive logging** — a logging system (Python logging module, ELK stack) to track recognition events, errors, and system performance would make debugging and auditing much easier

---

## QUICK FIRE ROUND

**Q: Full form of JWT?**  
A: JSON Web Token

**Q: What port does your backend run on?**  
A: 8000 (FastAPI/uvicorn)

**Q: What port does your frontend run on?**  
A: 5173 (Vite dev server)

**Q: How many face samples do you capture?**  
A: 10 samples per student

**Q: What is the default recognition threshold?**  
A: 70%

**Q: Which library does face_recognition use internally?**  
A: dlib

**Q: How many dimensions is a face encoding?**  
A: 128 dimensions

**Q: What database do you use?**  
A: SQLite (via SQLAlchemy ORM)

**Q: What scan interval does the attendance camera use?**  
A: Every 3 seconds automatically

**Q: How many test cases did you execute?**  
A: 46 test cases, 100% pass rate

**Q: What is the accuracy of your face recognition?**  
A: ~95–97% under good lighting

**Q: How do you prevent proxy attendance?**  
A: Biometric face recognition — cannot be faked

**Q: What is HOG?**  
A: Histogram of Oriented Gradients — face detection algorithm

**Q: What is bcrypt used for?**  
A: Hashing admin passwords

**Q: How are face encodings stored?**  
A: JSON string in SQLite TEXT column

**Q: What is the size of the frontend build?**  
A: ~688 KB (minified JavaScript)

**Q: How many database tables?**  
A: 5 tables (admins, students, subjects, attendance, app_settings)

---

## TRICKY QUESTIONS

---

**Q: What happens if two students have very similar faces (e.g., twins)?**

**A:** This is a known limitation of face recognition systems. With identical twins, the Euclidean distance between their encodings may be very small, making it difficult to distinguish them reliably. Solutions include: increasing the threshold (stricter matching), combining with another identifier (student ID card), or using more distinctive features. For typical students, false match rates are very low (~0.1% on LFW benchmark).

---

**Q: Is your system GDPR/privacy compliant?**

**A:** Biometric data (face encodings) is considered sensitive personal data under GDPR and similar regulations. Our system: (1) stores all data locally — no cloud, no external API, (2) requires admin authorization to access. For full compliance, we would need: explicit student consent forms, data retention policies, and the ability for students to request deletion of their biometric data.

---

**Q: How does the system handle simultaneous access by multiple admins?**

**A:** Currently, the system is designed for single-admin use. SQLite handles concurrent reads well but has limitations with concurrent writes. For multi-admin support, we would: (1) switch to PostgreSQL which handles concurrent writes via row-level locking, (2) add role-based access control (RBAC), (3) use connection pooling. This is noted in the future scope.

---

*Viva Questions Document | 40+ Questions with Detailed Answers | August 2025*  
*Prepared for Final-Year Project Oral Examination*
