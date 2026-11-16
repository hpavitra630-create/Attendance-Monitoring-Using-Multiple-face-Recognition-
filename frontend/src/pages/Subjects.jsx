import { useState, useEffect } from 'react';
import { Plus, Search, RotateCcw, Pencil, Trash2, BookOpen, Building, GraduationCap, BookX } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DEPTS  = ['All', 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const SEMS   = ['All', '1','2','3','4','5','6','7','8'];
const STATS  = ['All', 'Active', 'Inactive'];
const PER_PAGE = 8;

const BLANK = { subject_code: '', subject_name: '', department: 'Computer Science', semester: '6', faculty: '', is_active: true };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [dept, setDept]         = useState('All');
  const [sem, setSem]           = useState('All');
  const [stat, setStat]         = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(BLANK);
  const [saving, setSaving]     = useState(false);

  // Global counts (full dataset, independent of current page/filters)
  const [globalStats, setGlobalStats] = useState({ active: 0, inactive: 0, depts: 0, total: 0 });

  useEffect(() => { load(); }, [page]);
  useEffect(() => { loadGlobalStats(); }, []);

  // Fetch counts from the full dataset so stat cards are always accurate
  const loadGlobalStats = async () => {
    try {
      const res = await api.get('/subjects', { params: { limit: 2000 } });
      const all = res.data.data || [];
      setGlobalStats({
        total:    res.data.total || all.length,
        active:   all.filter(s => s.is_active).length,
        inactive: all.filter(s => !s.is_active).length,
        depts:    new Set(all.map(s => s.department)).size,
      });
    } catch { /* non-critical */ }
  };

  useEffect(() => { load(); }, [page]);

  const load = async (extra = {}) => {
    setLoading(true);
    try {
      const params = {
        page, limit: PER_PAGE,
        search: search || undefined,
        department: dept !== 'All' ? dept : undefined,
        semester:   sem  !== 'All' ? sem  : undefined,
        status:     stat !== 'All' ? stat.toLowerCase() : undefined,
        ...extra,
      };
      const res = await api.get('/subjects', { params });
      setSubjects(res.data.data || []);
      setTotal(res.data.total || res.data.data?.length || 0);
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); load({ page:1 }); };
  const handleReset  = () => {
    setSearch(''); setDept('All'); setSem('All'); setStat('All');
    setPage(1); load({ page:1, search:undefined, department:undefined, semester:undefined, status:undefined });
  };

  const openAdd  = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ subject_code: s.subject_code, subject_name: s.subject_name, department: s.department, semester: s.semester, faculty: s.faculty || '', is_active: s.is_active }); setShowModal(true); };

  const save = async () => {
    if (!form.subject_code || !form.subject_name) { toast.error('Code and name required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/subjects/${editing.id}`, form);
        toast.success('Subject updated');
      } else {
        await api.post('/subjects', form);
        toast.success('Subject added');
      }
      setShowModal(false); load(); loadGlobalStats();
    } catch (e) { toast.error(e.response?.data?.detail || 'Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try { await api.delete(`/subjects/${id}`); toast.success('Deleted'); load(); loadGlobalStats(); }
    catch { toast.error('Delete failed'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      {/* Title + Add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Subjects</h1>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Subject</button>
      </div>

      {/* Stat cards */}
      <div className="stats-grid mb-4">
        {[
          { label: 'Total Subjects',    value: globalStats.total,    color: 'blue',   icon: <BookOpen size={26}/> },
          { label: 'Departments',       value: globalStats.depts,    color: 'green',  icon: <Building size={26}/> },
          { label: 'Active Subjects',   value: globalStats.active,   color: 'purple', icon: <GraduationCap size={26}/> },
          { label: 'Inactive Subjects', value: globalStats.inactive, color: 'red',    icon: <BookX size={26}/> },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ cursor: 'default' }}>
            <div className={`stat-icon ${c.color}`}>{c.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{c.label}</div>
              <div className={`stat-value ${c.color}`}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap flex-1" style={{ minWidth: 200 }}>
          <Search />
          <input className="form-control" placeholder="Search by Subject Code or Name..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        </div>
        {[
          { label: 'Department', val: dept, set: setDept, opts: DEPTS },
          { label: 'Semester',   val: sem,  set: setSem,  opts: SEMS  },
          { label: 'Status',     val: stat, set: setStat, opts: STATS },
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
          {loading ? <div className="loading-overlay"><div className="spinner"/></div> : (
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Subject Code</th><th>Subject Name</th><th>Department</th>
                  <th>Semester</th><th>Faculty</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:48, color:'#9ca3af' }}>
                    No subjects found. <button onClick={openAdd} style={{ background:'none', border:'none', color:'#2563eb', fontWeight:600, cursor:'pointer' }}>Add the first subject →</button>
                  </td></tr>
                ) : subjects.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color:'#6b7280' }}>{(page-1)*PER_PAGE+i+1}</td>
                    <td style={{ fontWeight:600 }}>{s.subject_code}</td>
                    <td>{s.subject_name}</td>
                    <td style={{ color:'#6b7280' }}>{s.department}</td>
                    <td style={{ textAlign:'center' }}>{s.semester}</td>
                    <td style={{ color:'#6b7280' }}>{s.faculty || '—'}</td>
                    <td><span className={s.is_active ? 'badge badge-active' : 'badge badge-inactive'}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-primary btn-icon btn-sm" onClick={() => openEdit(s)}><Pencil size={13}/></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => del(s.id)}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderTop:'1px solid #f0f0f0' }}>
          <span style={{ fontSize:12, color:'#6b7280' }}>Showing 1 to {subjects.length} of {total} entries</span>
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages-4, page-2)) + i;
              return <button key={p} className={`page-btn${page===p?' active':''}`} onClick={() => setPage(p)}>{p}</button>;
            })}
            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>›</button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, width:480, maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize:17, fontWeight:700, marginBottom:20 }}>{editing ? 'Edit Subject' : 'Add Subject'}</h3>
            {[
              { label:'Subject Code',  key:'subject_code',  type:'text',   placeholder:'e.g. CS601' },
              { label:'Subject Name',  key:'subject_name',  type:'text',   placeholder:'e.g. Python Programming' },
              { label:'Faculty',       key:'faculty',       type:'text',   placeholder:'e.g. Dr. Smith' },
            ].map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                <input type={f.type} className="form-control" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={form.department} onChange={e => setForm(x => ({ ...x, department: e.target.value }))}>
                  {DEPTS.filter(d => d !== 'All').map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select className="form-control" value={form.semester} onChange={e => setForm(x => ({ ...x, semester: e.target.value }))}>
                  {SEMS.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="flex items-center gap-2" style={{ cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(x => ({ ...x, is_active: e.target.checked }))} style={{ accentColor:'#2563eb', width:14, height:14 }}/>
                Active Subject
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-outline-gray" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Subject'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
