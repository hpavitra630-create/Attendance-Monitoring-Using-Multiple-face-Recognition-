import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, RefreshCw, X, ScanFace, User, Upload } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const COURSES = ['BCA', 'MCA', 'B.Tech', 'M.Tech', 'B.Sc', 'M.Sc'];
const GENDERS = ['Male', 'Female', 'Other'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const SECTIONS = ['A', 'B', 'C', 'D'];

const emptyForm = {
  student_id: '',
  usn: '',           // University Seat Number — PRD §11
  name: '',
  gender: '',
  date_of_birth: '',
  department: '',
  course: '',
  semester: '',
  section: '',
  phone: '',
  email: '',
  address: '',
};

export default function StudentRegister() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [usePhotoForFace, setUsePhotoForFace] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (studentId) {
      setIsEdit(true);
      loadStudent(studentId);
    }
  }, [studentId]);

  const loadStudent = async (sid) => {
    setLoadingStudent(true);
    try {
      const res = await api.get(`/students/${sid}`);
      const s = res.data.data;
      setForm({
        student_id: s.student_id,
        usn: s.usn || '',
        name: s.name,
        gender: s.gender || '',
        date_of_birth: s.date_of_birth || '',
        department: s.department,
        course: s.course,
        semester: s.semester || '',
        section: s.section || '',
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
      });
      if (s.photo_path) {
        setPhotoPreview(`/uploads/students/${s.student_id}.jpg`);
      }
    } catch {
      toast.error('Failed to load student data.');
    } finally {
      setLoadingStudent(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.student_id.trim()) errs.student_id = 'Student ID is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.department) errs.department = 'Department is required';
    if (!form.course) errs.course = 'Course is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Invalid email address';
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\s/g, '')))
      errs.phone = 'Phone must be 10 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    let studentSaved = false;
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (photo) formData.append('photo', photo);

      if (isEdit) {
        await api.put(`/students/${form.student_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/students', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      studentSaved = true;

      // A single clear portrait is enough to create an SFace encoding. This is
      // an alternative to the webcam workflow, not an additional requirement.
      if (photo && usePhotoForFace) {
        const faceData = new FormData();
        faceData.append('student_id', form.student_id.trim().toUpperCase());
        faceData.append('sample_index', '0');
        faceData.append('replace_existing', 'true');
        faceData.append('image', photo);
        await api.post('/face/register', faceData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const encodeData = new FormData();
        encodeData.append('student_id', form.student_id.trim().toUpperCase());
        await api.post('/face/encode', encodeData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(photo && usePhotoForFace
        ? 'Student saved and face recognition is ready!'
        : (isEdit ? 'Student updated successfully!' : 'Student registered successfully!'));
      navigate('/students');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save student.';
      toast.error(studentSaved ? `Student saved, but face setup failed: ${msg}` : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!isEdit) {
      setForm(emptyForm);
      setPhoto(null);
      setPhotoPreview(null);
      setErrors({});
    }
  };

  const handleCancel = () => navigate('/students');

  if (loadingStudent) {
    return (
      <div className="loading-overlay" style={{ height: '50vh' }}>
        <div className="spinner" />
        <span>Loading student data...</span>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
          {/* Left: Form */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                {isEdit ? 'Edit Student Information' : 'Student Registration Form'}
              </h2>
            </div>
            <div className="card-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Student ID *</label>
                  <input
                    type="text"
                    name="student_id"
                    className="form-control"
                    placeholder="e.g. STU007"
                    value={form.student_id}
                    onChange={handleChange}
                    disabled={isEdit}
                    id="student-id-input"
                  />
                  {errors.student_id && <span className="form-error">{errors.student_id}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">USN (University Seat Number)</label>
                  <input
                    type="text"
                    name="usn"
                    className="form-control"
                    placeholder="e.g. 1XX22IS001"
                    value={form.usn}
                    onChange={handleChange}
                    id="usn-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Student Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Full name"
                    value={form.name}
                    onChange={handleChange}
                    id="student-name-input"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select name="gender" className="form-control" value={form.gender} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    {GENDERS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    className="form-control"
                    value={form.date_of_birth}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select name="department" className="form-control" value={form.department} onChange={handleChange}>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  {errors.department && <span className="form-error">{errors.department}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select name="course" className="form-control" value={form.course} onChange={handleChange}>
                    <option value="">Select Course</option>
                    {COURSES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  {errors.course && <span className="form-error">{errors.course}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select name="semester" className="form-control" value={form.semester} onChange={handleChange}>
                    <option value="">Select</option>
                    {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select name="section" className="form-control" value={form.section} onChange={handleChange}>
                    <option value="">Select</option>
                    {SECTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    placeholder="10-digit phone number"
                    value={form.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  name="address"
                  className="form-control"
                  placeholder="Full address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</>
                  ) : (
                    <><Save size={14} /> {isEdit ? 'Update' : 'Save'}</>
                  )}
                </button>
                {!isEdit && (
                  <button type="button" className="btn btn-outline-gray" onClick={handleReset}>
                    <RefreshCw size={14} /> Reset
                  </button>
                )}
                {isEdit && form.student_id && (
                  <Link to={`/face-registration?student=${form.student_id}`} className="btn btn-success">
                    <ScanFace size={14} /> Register Face
                  </Link>
                )}
                <button type="button" className="btn btn-outline-gray" onClick={handleCancel}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Right: Photo */}
          <div className="flex flex-col gap-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Student Photo</h3>
              </div>
              <div className="card-body">
                <div className="photo-preview" style={{ aspectRatio: '1', maxHeight: 220 }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Student" />
                  ) : (
                    <div className="photo-preview-placeholder">
                      <User size={48} color="#cbd5e1" />
                      <span>No photo selected</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  className="btn btn-outline w-full mt-3"
                  onClick={() => fileRef.current.click()}
                >
                  <Upload size={14} /> Upload Photo
                </button>
                {photo && (
                  <p className="text-sm text-muted mt-2 text-center truncate">{photo.name}</p>
                )}
                {photo && (
                  <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={usePhotoForFace}
                      onChange={e => setUsePhotoForFace(e.target.checked)}
                      style={{ marginTop: 2 }}
                    />
                    <span><strong>Use this photo for face recognition</strong><br />One clear, front-facing portrait is required. It replaces previous face samples.</span>
                  </label>
                )}
              </div>
            </div>

            {isEdit && form.student_id && (
              <div className="card">
                <div className="card-body" style={{ padding: '16px' }}>
                  <div className="text-sm text-secondary mb-3">
                    Capture and register the student's face for attendance recognition.
                  </div>
                  <Link
                    to={`/face-registration?student=${form.student_id}`}
                    className="btn btn-success w-full"
                    style={{ justifyContent: 'center' }}
                  >
                    <ScanFace size={15} /> Go to Face Registration
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
