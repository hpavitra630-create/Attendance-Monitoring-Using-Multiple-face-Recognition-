import { useState, useEffect } from 'react';
import { Search, RotateCcw, ShieldCheck, User, BookOpen, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  login:                    'badge-present',
  student_created:          'badge-blue',
  student_modified:         'badge-blue',
  face_registered:          'badge-purple',
  face_deleted:             'badge-danger',
  session_created:          'badge-orange',
  session_started:          'badge-orange',
  session_completed:        'badge-present',
  attendance_corrected:     'badge-warning',
  attendance_marked:        'badge-present',
  attendance_deleted:       'badge-danger',
  student_deleted:          'badge-danger',
  password_changed:         'badge-warning',
  bulk_import:              'badge-blue',
  report_exported:          'badge-gray',
  image_upload_attendance:  'badge-warning',   // ← anti-spoof flag
};

const PER_PAGE = 50;

export default function AuditLogs() {
  const [logs, setLogs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [actionFilter, setAction] = useState('');
  const [expandedLog, setExpandedLog] = useState(null); // id of expanded details row

  useEffect(() => { load(); }, [page]);

  const load = async (extra = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: {
          skip: (page - 1) * PER_PAGE,
          limit: PER_PAGE,
          action: actionFilter || undefined,
          username: search || undefined,
          ...extra,
        },
      });
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); load({ skip: 0, username: search, action: actionFilter || undefined }); };
  const handleReset  = () => {
    // Clear state first, then load with explicit empty params so stale state
    // values are not read by load() before React re-renders.
    setSearch(''); setAction(''); setPage(1); setExpandedLog(null);
    load({ skip: 0, username: undefined, action: undefined });
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const badgeClass = (action) => ACTION_COLORS[action] || 'badge-gray';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Audit Logs</h1>
        <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: 20 }}>
          {total} total events
        </span>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap flex-1" style={{ minWidth: 200 }}>
          <User size={15} />
          <input
            className="form-control"
            placeholder="Filter by username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Action</label>
          <select className="form-control" value={actionFilter} onChange={e => setAction(e.target.value)}>
            <option value="">All Actions</option>
            <option value="login">login</option>
            <option value="student_created">student_created</option>
            <option value="student_modified">student_modified</option>
            <option value="student_deleted">student_deleted</option>
            <option value="face_registered">face_registered</option>
            <option value="face_deleted">face_deleted</option>
            <option value="session_created">session_created</option>
            <option value="session_started">session_started</option>
            <option value="session_completed">session_completed</option>
            <option value="attendance_corrected">attendance_corrected</option>
            <option value="attendance_marked">attendance_marked</option>
            <option value="attendance_deleted">attendance_deleted</option>
            <option value="image_upload_attendance">image_upload_attendance ⚠️</option>
            <option value="password_changed">password_changed</option>
            <option value="bulk_import">bulk_import</option>
            <option value="report_exported">report_exported</option>
          </select>
        </div>
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
                  <th><User size={13} style={{ verticalAlign: 'middle', marginRight: 4 }}/>User</th>
                  <th><ShieldCheck size={13} style={{ verticalAlign: 'middle', marginRight: 4 }}/>Action</th>
                  <th><BookOpen size={13} style={{ verticalAlign: 'middle', marginRight: 4 }}/>Entity</th>
                  <th>Entity ID</th>
                  <th>Details</th>
                  <th><Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }}/>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
                    No audit log entries found.
                  </td></tr>
                ) : logs.map((log, i) => (
                  <tr key={log.id}>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{log.username || <span style={{ color: '#9ca3af' }}>system</span>}</td>
                    <td>
                      <span className={`badge ${badgeClass(log.action)}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280' }}>{log.entity || '—'}</td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{log.entity_id || '—'}</td>
                    <td style={{ color: '#6b7280', fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details || '—'}
                    </td>
                    <td style={{ color: '#6b7280', whiteSpace: 'nowrap', fontSize: 12 }}>{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Showing {Math.min((page - 1) * PER_PAGE + 1, total)}–{Math.min(page * PER_PAGE, total)} of {total}
          </span>
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
            })}
            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
