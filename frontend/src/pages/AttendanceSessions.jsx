import { useEffect, useState } from 'react';
import { CalendarClock, Play, CheckCircle2, XCircle, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const today = () => new Date().toISOString().slice(0, 10);
const statusColor = { ACTIVE: '#166534', COMPLETED: '#1d4ed8', CANCELLED: '#991b1b', DRAFT: '#92400e' };

export default function AttendanceSessions() {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ class_name: '', section: '', department: '', subject_id: '', session_date: today(), notes: '' });
  const [editSession, setEditSession] = useState(null);   // session being edited
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);         // id being deleted

  const load = async () => {
    setLoading(true);
    try {
      const [sessionResponse, subjectResponse] = await Promise.all([api.get('/attendance/sessions', { params: { limit: 100 } }), api.get('/subjects')]);
      setSessions(sessionResponse.data.data || []);
      setSubjects(subjectResponse.data.data || []);
    } catch { toast.error('Could not load class sessions.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/attendance/sessions', { ...form, subject_id: form.subject_id ? Number(form.subject_id) : null });
      toast.success('Class session created as a draft.');
      setForm({ class_name: '', section: '', department: '', subject_id: '', session_date: today(), notes: '' });
      load();
    } catch (error) { toast.error(error.response?.data?.detail || 'Could not create the session.'); }
    finally { setSaving(false); }
  };
  const transition = async (id, action) => {
    try { const result = await api.post(`/attendance/sessions/${id}/${action}`); toast.success(result.data.message); load(); }
    catch (error) { toast.error(error.response?.data?.detail || 'Could not update the session.'); }
  };

  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div><h1 className="page-title" style={{ marginBottom: 4 }}>Class Sessions</h1><p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>Create a controlled attendance window before starting the camera.</p></div>
      <button className="btn btn-outline-gray" onClick={load}><RefreshCw size={15} /> Refresh</button>
    </div>
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header"><span className="card-title"><Plus size={16} style={{ verticalAlign: 'middle', marginRight: 7 }} />New class session</span></div>
      <form className="card-body" onSubmit={create}><div className="filter-bar" style={{ margin: 0, padding: 0, border: 0 }}>
        <div className="filter-group"><label className="filter-label">Class name</label><input className="form-control" required placeholder="e.g. ISE 3A" value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })} /></div>
        <div className="filter-group"><label className="filter-label">Section</label><input className="form-control" placeholder="A" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} /></div>
        <div className="filter-group"><label className="filter-label">Department</label><input className="form-control" placeholder="Information Science" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
        <div className="filter-group"><label className="filter-label">Subject</label><select className="form-control" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}><option value="">Not specified</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} — {s.subject_name}</option>)}</select></div>
        <div className="filter-group"><label className="filter-label">Date</label><input type="date" className="form-control" required value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} /></div>
        <div className="filter-group"><label className="filter-label">Notes</label><input className="form-control" placeholder="Optional" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <div style={{ paddingTop: 16 }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : <><CalendarClock size={15} /> Create draft</>}</button></div>
      </div></form>
    </div>
    <div className="card"><div className="card-header"><span className="card-title">Recent sessions</span></div><div className="table-container"><table><thead><tr><th>Session</th><th>Date</th><th>Subject</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead><tbody>
      {!loading && sessions.length === 0 && <tr><td colSpan="6" style={{ padding: 42, textAlign: 'center', color: '#6b7280' }}>No sessions yet. Create a draft for the next class.</td></tr>}
      {sessions.map(s => { const subject = subjects.find(item => item.id === s.subject_id); return <tr key={s.id}><td><strong>{s.class_name || 'Untitled class'}</strong><br /><small style={{ color: '#6b7280' }}>{[s.department, s.section && `Section ${s.section}`].filter(Boolean).join(' · ') || 'No class details'}</small></td><td>{s.session_date}</td><td>{subject ? `${subject.subject_code} — ${subject.subject_name}` : '—'}</td><td><span style={{ color: statusColor[s.status] || '#374151', fontWeight: 700, fontSize: 12 }}>{s.status}</span></td><td>{s.start_time || '—'}{s.end_time ? ` – ${s.end_time}` : ''}</td><td style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{s.status === 'DRAFT' && <><button className="btn btn-success" onClick={() => transition(s.id, 'start')}><Play size={14} /> Start</button><button className="btn btn-outline-gray" onClick={() => openEdit(s)} title="Edit draft"><Pencil size={14} /> Edit</button><button className="btn btn-danger" onClick={() => deleteSession(s.id)} disabled={deleting === s.id}><Trash2 size={14} /> Delete</button><button className="btn btn-outline-gray" onClick={() => transition(s.id, 'cancel')}><XCircle size={14} /> Cancel</button></>}{s.status === 'ACTIVE' && <><button className="btn btn-primary" onClick={() => transition(s.id, 'complete')}><CheckCircle2 size={14} /> Complete</button><button className="btn btn-danger" onClick={() => transition(s.id, 'cancel')}><XCircle size={14} /> Cancel</button></>}</td></tr>; })}
    </tbody></table></div></div>
  {/* Edit Draft Session Modal */}
  {editSession && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Edit Draft Session #{editSession.id}</h3>
        <form onSubmit={saveEdit}>
          <div className="filter-bar" style={{ margin: 0, padding: 0, border: 0 }}>
            <div className="filter-group"><label className="filter-label">Class name</label><input className="form-control" required value={editForm.class_name} onChange={e => setEditForm({ ...editForm, class_name: e.target.value })} /></div>
            <div className="filter-group"><label className="filter-label">Section</label><input className="form-control" value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })} /></div>
            <div className="filter-group"><label className="filter-label">Department</label><input className="form-control" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} /></div>
            <div className="filter-group"><label className="filter-label">Subject</label><select className="form-control" value={editForm.subject_id} onChange={e => setEditForm({ ...editForm, subject_id: e.target.value })}><option value="">Not specified</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} � {s.subject_name}</option>)}</select></div>
            <div className="filter-group"><label className="filter-label">Date</label><input type="date" className="form-control" required value={editForm.session_date} onChange={e => setEditForm({ ...editForm, session_date: e.target.value })} /></div>
            <div className="filter-group"><label className="filter-label">Notes</label><input className="form-control" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
            <button type="button" className="btn btn-outline-gray" onClick={() => setEditSession(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={editSaving}>{editSaving ? 'Saving�' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )}
  </div>;
}
