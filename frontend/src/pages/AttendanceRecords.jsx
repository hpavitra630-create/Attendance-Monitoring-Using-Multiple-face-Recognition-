import { useState, useEffect } from 'react';
import { Search, RotateCcw, FileSpreadsheet, FileText, Trash2, RefreshCw, Edit3, History } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DEPTS    = ['All', 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const STATUSES = ['All', 'Present', 'Absent'];
const PER_PAGE = 10;

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
}

export default function AttendanceRecords() {
  const [records, setRecords]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState([]);
  const [correction, setCorrection] = useState(null);
  const [history, setHistory] = useState(null);

  const today     = new Date().toISOString().split('T')[0];
  const monthAgo  = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo]     = useState(today);
  const [dept, setDept]         = useState('All');
  const [status, setStatus]     = useState('All');
  const [studentId, setStudentId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');

  useEffect(() => { load(); }, [page]);
  useEffect(() => { api.get('/subjects').then(res => setSubjects(res.data.data || [])).catch(() => setSubjects([])); }, []);

  const load = async (extra = {}) => {
    setLoading(true);
    setSelected([]);
    try {
      const params = {
        skip: (page - 1) * PER_PAGE, limit: PER_PAGE,
        date_from:  dateFrom || undefined,
        date_to:    dateTo   || undefined,
        department: dept   !== 'All' ? dept   : undefined,
        status:     status !== 'All' ? status : undefined,
        student_id: studentId.trim() || undefined,
        subject_id: subjectId || undefined,
        ...extra,
      };
      const res = await api.get('/attendance', { params });
      setRecords(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); load({ skip: 0 }); };
  const handleReset  = () => {
    setDateFrom(monthAgo); setDateTo(today); setDept('All'); setStatus('All'); setStudentId(''); setSubjectId('');
    setPage(1); load({ skip: 0, date_from: monthAgo, date_to: today, department: undefined, status: undefined, student_id: undefined, subject_id: undefined });
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll    = () => setSelected(selected.length === records.length ? [] : records.map(r => r.id));

  const deleteSelected = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} record(s)?`)) return;
    try {
      await Promise.all(selected.map(id => api.delete(`/attendance/${id}`)));
      toast.success('Deleted successfully'); load();
    } catch { toast.error('Delete failed'); }
  };

  const submitCorrection = async (event) => {
    event.preventDefault();
    if (!correction.reason.trim()) { toast.error('A correction reason is required.'); return; }
    try {
      await api.put(`/attendance/${correction.record.id}`, { new_status: correction.status, reason: correction.reason.trim() });
      toast.success('Attendance corrected and recorded in the audit trail.');
      setCorrection(null); load();
    } catch (error) { toast.error(error.response?.data?.detail || 'Correction failed.'); }
  };

  const viewHistory = async (record) => {
    try { const res = await api.get(`/attendance/${record.id}/corrections`); setHistory({ record, items: res.data.data || [] }); }
    catch { toast.error('Could not load correction history.'); }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/reports/export/csv', { params: { date_from: dateFrom, date_to: dateTo, department: dept !== 'All' ? dept : undefined, status: status !== 'All' ? status : undefined, student_id: studentId || undefined, subject_id: subjectId || undefined }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'attendance.csv'; a.click();
    } catch { toast.error('Export failed'); }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get('/reports/export/excel', { params: { date_from: dateFrom, date_to: dateTo, department: dept !== 'All' ? dept : undefined, status: status !== 'All' ? status : undefined, student_id: studentId || undefined, subject_id: subjectId || undefined }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'attendance.xlsx'; a.click();
    } catch { toast.error('Export failed'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom:20 }}>Attendance Records</h1>
      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Date From</label>
          <input type="date" className="form-control" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label className="filter-label">Date To</label>
          <input type="date" className="form-control" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div className="filter-group">
          <label className="filter-label">Department</label>
          <select className="form-control" value={dept} onChange={e => setDept(e.target.value)}>
            {DEPTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Student ID</label>
          <input className="form-control" placeholder="e.g. 3VC23IS001" value={studentId} onChange={e => setStudentId(e.target.value.toUpperCase())} />
        </div>
        <div className="filter-group">
          <label className="filter-label">Subject</label>
          <select className="form-control" value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">All subjects</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.subject_code} — {subject.subject_name}</option>)}</select>
        </div>
        <div className="flex gap-2 items-center" style={{ paddingTop: 16 }}>
          <button className="btn btn-primary" onClick={handleSearch}><Search size={14}/> Search</button>
          <button className="btn btn-outline-gray" onClick={handleReset}><RotateCcw size={14}/> Reset</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="table-container">
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selected.length === records.length && records.length > 0} onChange={toggleAll} style={{ accentColor: '#2563eb' }} /></th>
                  <th>ID</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th><th>Method</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>No attendance records found.</td></tr>
                ) : records.map((r, i) => (
                  <tr key={r.id}>
                    <td><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)} style={{ accentColor: '#2563eb' }} /></td>
                    <td style={{ color: '#6b7280' }}>{(page-1)*PER_PAGE + i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{r.student_id}</td>
                    <td>{r.student_name || '—'}</td>
                    <td style={{ color: '#6b7280' }}>{r.department || '—'}</td>
                    <td style={{ color: '#6b7280' }}>{r.subject_name || r.subject_code || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.date)}</td>
                    <td style={{ whiteSpace: 'nowrap', color: '#6b7280' }}>{r.time || r.time_in || '—'}</td>
                    <td>
                       <span className={r.status === 'Present' ? 'status-present' : 'status-absent'}>{r.status}</span>
                       {r.recognition_method === 'image_upload' && (
                         <span
                           title="Marked via uploaded image � verify for possible spoofing"
                           style={{ marginLeft: 6, display: 'inline-block', background: '#f59e0b', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, verticalAlign: 'middle' }}
                         >?? Upload</span>
                       )}
                     </td>
                    <td style={{ display: 'flex', gap: 6 }}><button className="btn btn-outline-gray" title="Correct attendance" onClick={() => setCorrection({ record: r, status: r.status, reason: '' })}><Edit3 size={14} /></button><button className="btn btn-outline-gray" title="Correction history" onClick={() => viewHistory(r)}><History size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Showing {Math.min((page-1)*PER_PAGE+1, total)}–{Math.min(page*PER_PAGE, total)} of {total} records
          </span>
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages-4, page-2)) + i;
              return <button key={p} className={`page-btn${page===p?' active':''}`} onClick={() => setPage(p)}>{p}</button>;
            })}
            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>›</button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button className="btn btn-success" onClick={exportExcel}><FileSpreadsheet size={15}/> Export Excel</button>
        <button className="btn btn-primary" onClick={exportCSV}><FileText size={15}/> Export CSV</button>
        <button className="btn btn-danger" onClick={deleteSelected} disabled={!selected.length}><Trash2 size={15}/> Delete Selected{selected.length > 0 ? ` (${selected.length})` : ''}</button>
        <button className="btn btn-outline-gray" onClick={() => load()}><RefreshCw size={15}/> Refresh</button>
      </div>
      {correction && <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, .46)', display: 'grid', placeItems: 'center', zIndex: 20, padding: 16 }}><form className="card" onSubmit={submitCorrection} style={{ width: 'min(460px, 100%)' }}><div className="card-header"><span className="card-title">Correct attendance</span></div><div className="card-body"><p style={{ marginTop: 0, color: '#6b7280', fontSize: 13 }}>{correction.record.student_name || correction.record.student_id} · {fmtDate(correction.record.date)}</p><div className="form-group"><label className="form-label">New status</label><select className="form-control" value={correction.status} onChange={e => setCorrection({ ...correction, status: e.target.value })}><option>Present</option><option>Absent</option><option>Late</option><option>Excused</option></select></div><div className="form-group"><label className="form-label">Reason</label><textarea className="form-control" required rows="3" placeholder="Explain why this record is being changed" value={correction.reason} onChange={e => setCorrection({ ...correction, reason: e.target.value })} /></div><div className="flex gap-2" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn btn-outline-gray" onClick={() => setCorrection(null)}>Cancel</button><button className="btn btn-primary">Save correction</button></div></div></form></div>}
      {history && <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, .46)', display: 'grid', placeItems: 'center', zIndex: 20, padding: 16 }}><div className="card" style={{ width: 'min(600px, 100%)' }}><div className="card-header"><span className="card-title">Correction history</span><button className="btn btn-outline-gray" onClick={() => setHistory(null)}>Close</button></div><div className="card-body">{history.items.length === 0 ? <p style={{ color: '#6b7280' }}>This record has not been corrected.</p> : history.items.map(item => <div key={item.id} style={{ borderLeft: '3px solid #2563eb', paddingLeft: 12, marginBottom: 14 }}><strong>{item.old_status} → {item.new_status}</strong><div style={{ fontSize: 13, marginTop: 3 }}>{item.reason}</div><small style={{ color: '#6b7280' }}>{item.updated_by} · {new Date(item.updated_at).toLocaleString('en-IN')}</small></div>)}</div></div></div>}
    </div>
  );
}
