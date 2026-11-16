import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, RotateCcw, Plus, Pencil, Trash2, Users, User, Upload } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import BulkImport from '../components/BulkImport';

const DEPARTMENTS = ['All', 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const COURSES     = ['All', 'BCA', 'MCA', 'B.Tech', 'M.Tech'];
const SEMESTERS   = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];
const SECTIONS    = ['All', 'A', 'B', 'C', 'D'];
const PER_PAGE    = 8;

export default function Students() {
  const [students, setStudents]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [dept, setDept]           = useState('All');
  const [course, setCourse]       = useState('All');
  const [semester, setSemester]   = useState('All');
  const [section, setSection]     = useState('All');
  const [showImport, setShowImport] = useState(false);

  // Global stats fetched from full student list (not just current page)
  const [globalStats, setGlobalStats] = useState({ total: 0, faceEncoded: 0, active: 0, departments: 0 });

  useEffect(() => { load(); }, [page]);
  useEffect(() => { loadGlobalStats(); }, []);

  // Fetch global counts independent of pagination/filters
  const loadGlobalStats = async () => {
    try {
      const res = await api.get('/students', { params: { limit: 2000, page: 1 } });
      const all = res.data.data || [];
      setGlobalStats({
        total:       res.data.total || 0,
        faceEncoded: all.filter(s => s.has_face_encoding).length,
        active:      all.filter(s => s.is_active).length,
        departments: new Set(all.map(s => s.department)).size,
      });
    } catch { /* silently ignore — stats are non-critical */ }
  };

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const p = {
        page, limit: PER_PAGE,
        search: search || undefined,
        department: dept !== 'All' ? dept : undefined,
        course:     course !== 'All' ? course : undefined,
        semester:   semester !== 'All' ? semester : undefined,
        section:    section !== 'All' ? section : undefined,
        ...params,
      };
      const res = await api.get('/students', { params: p });
      setStudents(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); load({ page: 1 }); };
  const handleReset  = () => {
    setSearch(''); setDept('All'); setCourse('All'); setSemester('All'); setSection('All');
    setPage(1); load({ page: 1, search: undefined, department: undefined, course: undefined, semester: undefined, section: undefined });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete student ${id}?`)) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      {/* Page title row with Add / Import buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Students</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowImport(true)}
            className="btn btn-outline"
            style={{ fontSize: 13 }}
          >
            <Upload size={14} /> Import Students
          </button>
          <Link to="/students/register" className="btn btn-primary">
            <Plus size={15} /> Add Student
          </Link>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showImport && (
        <BulkImport
          onClose={() => setShowImport(false)}
          onImported={() => { load(); loadGlobalStats(); }}
        />
      )}

      {/* Stat cards — counts come from full dataset, not just current page */}
      <div className="stats-grid mb-4">
        {[
          { label: 'Total Students',  value: globalStats.total,       color: 'blue',   icon: <Users size={26} />, to: '/students' },
          { label: 'Face Registered', value: globalStats.faceEncoded, color: 'blue',   icon: <User size={26} />,  to: '/face-registration' },
          { label: 'Active Students', value: globalStats.active,      color: 'purple', icon: <User size={26} />,  to: '/attendance-records' },
          { label: 'Departments',     value: globalStats.departments,  color: 'orange', icon: <Users size={26} />, to: '/subjects' },
        ].map(c => (
          <Link key={c.label} to={c.to} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={`stat-icon ${c.color}`}>{c.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{c.label}</div>
              <div className={`stat-value ${c.color}`}>{c.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap flex-1" style={{ minWidth: 200 }}>
          <Search />
          <input
            className="form-control"
            placeholder="Search by Student ID or Name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        {[
          { label: 'Department', val: dept,     set: setDept,     opts: DEPARTMENTS },
          { label: 'Course',     val: course,   set: setCourse,   opts: COURSES     },
          { label: 'Semester',   val: semester, set: setSemester, opts: SEMESTERS   },
          { label: 'Section',    val: section,  set: setSection,  opts: SECTIONS    },
        ].map(f => (
          <div className="filter-group" key={f.label}>
            <label className="filter-label">{f.label}</label>
            <select className="form-control" value={f.val} onChange={e => f.set(e.target.value)}>
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div className="flex gap-2 items-center" style={{ paddingTop: 16 }}>
          <button className="btn btn-primary" onClick={handleSearch}><Search size={14}/> Search</button>
          <button className="btn btn-outline-gray" onClick={handleReset}><RotateCcw size={14}/> Reset</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student ID</th>
                  <th>USN</th>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Department</th>
                  <th>Course</th>
                  <th>Semester</th>
                  <th>Section</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={12} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
                    No students found. <Link to="/students/register" style={{ color: '#2563eb' }}>Add the first student →</Link>
                  </td></tr>
                ) : students.map((s, i) => (
                  <tr key={s.student_id}>
                    <td style={{ color: '#6b7280' }}>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.student_id}</td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{s.usn || '—'}</td>
                    <td>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#eff6ff', border: '1px solid #bfdbfe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        {s.photo_path
                          ? <img src={`/uploads/${s.photo_path.replace(/^.*uploads[/\\]/, '')}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <User size={16} color="#2563eb" />}
                      </div>
                    </td>
                    <td>{s.name}</td>
                    <td>
                      <span className={s.gender === 'Male' ? 'badge badge-male' : 'badge badge-female'}>
                        {s.gender}
                      </span>
                    </td>
                    <td>{s.department}</td>
                    <td>{s.course}</td>
                    <td style={{ textAlign: 'center' }}>{s.semester}</td>
                    <td style={{ textAlign: 'center' }}>{s.section}</td>
                    <td style={{ color: '#6b7280' }}>{s.phone}</td>
                    <td style={{ color: '#6b7280', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</td>
                    <td>
                      <div className="flex gap-1">
                        <Link to={`/students/${s.student_id}`} className="btn btn-sm" style={{ fontSize: 12, padding: '4px 8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                          View
                        </Link>
                        <Link to={`/students/register/${s.student_id}`} className="btn btn-primary btn-icon btn-sm">
                          <Pencil size={13} />
                        </Link>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(s.student_id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Showing {Math.min((page-1)*PER_PAGE+1, total)}–{Math.min(page*PER_PAGE, total)} of {total} entries
          </span>
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            {totalPages > 5 && <span style={{ padding: '0 4px', color: '#6b7280' }}>...</span>}
            {totalPages > 5 && (
              <button className={`page-btn${page === totalPages ? ' active' : ''}`} onClick={() => setPage(totalPages)}>{totalPages}</button>
            )}
            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>›</button>
            <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
