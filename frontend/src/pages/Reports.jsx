import { useEffect, useState } from 'react';
import { BarChart3, Users, CheckCircle, XCircle, PieChart, Download, FileText, Calendar } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PieChart as RPie, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const REPORT_TYPES = [
  { id: 'daily',   label: 'Daily Report',   desc: 'Attendance for one specific date' },
  { id: 'monthly', label: 'Monthly Report', desc: 'Attendance for a whole month' },
  { id: 'student', label: 'Student Report', desc: 'All students for selected month' },
  { id: 'subject', label: 'Subject Report', desc: 'Attendance by subject for a date' },
];

const COLORS = ['#16a34a', '#dc2626'];

export default function Reports() {
  const today = new Date().toISOString().split('T')[0];
  const [type, setType]       = useState('daily');
  const [date, setDate]       = useState(today);
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState(null);
  const [exporting, setExporting] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');

  useEffect(() => { api.get('/subjects').then(res => setSubjects(res.data.data || [])).catch(() => setSubjects([])); }, []);

  /* ── Generate Report ── */
  const generate = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await api.get('/reports/generate', { params: { report_type: type, date, subject_id: type === 'subject' && subjectId ? subjectId : undefined } });
      setData(res.data.data || res.data);
      toast.success('Report generated!');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to generate report');
    } finally { setLoading(false); }
  };

  /* ── Export CSV ── */
  const exportCSV = async () => {
    setExporting('csv');
    try {
      const parts = date.split('-');
      const params = type === 'monthly'
        ? { date_from: `${parts[0]}-${parts[1]}-01`, date_to: `${parts[0]}-${parts[1]}-31` }
        : { date_from: date, date_to: date, subject_id: type === 'subject' && subjectId ? subjectId : undefined };
      const res = await api.get('/reports/export/csv', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `attendance_${type}_${date}.csv`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  /* ── Export Excel ── */
  const exportExcel = async () => {
    setExporting('excel');
    try {
      const parts = date.split('-');
      const params = type === 'monthly'
        ? { date_from: `${parts[0]}-${parts[1]}-01`, date_to: `${parts[0]}-${parts[1]}-31` }
        : { date_from: date, date_to: date, subject_id: type === 'subject' && subjectId ? subjectId : undefined };
      const res = await api.get('/reports/export/excel', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `attendance_${type}_${date}.xlsx`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  /* ── Computed values ── */
  const present  = data?.present  || data?.present_count  || 0;
  const absent   = data?.absent   || data?.absent_count   || 0;
  const students = data?.total_students || data?.total    || 0;
  const pct      = students > 0 ? ((present / students) * 100).toFixed(1) : '0.0';

  const pieData = [
    { name: `Present (${present})`, value: present },
    { name: `Absent  (${absent})`,  value: absent  },
  ];

  /* ── Date label helper ── */
  const dateLabel = () => {
    if (!date) return '';
    const [y, m, d] = date.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (type === 'monthly') return `${months[parseInt(m)-1]} ${y}`;
    return `${d} ${months[parseInt(m)-1]} ${y}`;
  };

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Reports</h1>

      {/* ── Top controls row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, marginBottom: 20, alignItems: 'start' }}>

        {/* Report type selector */}
        <div className="card">
          <div className="card-header"><span className="card-title">Report Type</span></div>
          <div className="card-body" style={{ padding: '8px 16px' }}>
            {REPORT_TYPES.map(t => (
              <label key={t.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
              }}>
                <input
                  type="radio" name="report_type" value={t.id}
                  checked={type === t.id} onChange={() => { setType(t.id); setData(null); }}
                  style={{ accentColor: '#2563eb', width: 15, height: 15, marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: type === t.id ? '#2563eb' : '#111' }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{t.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Right controls */}
        <div>
          {/* Date picker + Generate */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div className="flex gap-3 items-center flex-wrap">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {type === 'monthly' ? 'Select Month' : 'Select Date'}
                  </label>
                  <input
                    type={type === 'monthly' ? 'month' : 'date'}
                    className="form-control"
                    value={type === 'monthly' ? date.slice(0, 7) : date}
                    onChange={e => {
                      const v = e.target.value;
                      setDate(type === 'monthly' ? v + '-01' : v);
                      setData(null);
                    }}
                    style={{ maxWidth: 200 }}
                  />
                </div>
                {type === 'subject' && <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Subject</label><select className="form-control" value={subjectId} onChange={e => { setSubjectId(e.target.value); setData(null); }} style={{ minWidth: 230 }}><option value="">All subjects</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.subject_code} — {subject.subject_name}</option>)}</select></div>}

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 1 }}>
                  <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ minWidth: 140 }}>
                    {loading
                      ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Generating...</>
                      : <><BarChart3 size={15} /> Generate</>}
                  </button>

                  {data && (
                    <>
                      <button className="btn btn-success" onClick={exportExcel} disabled={!!exporting} style={{ minWidth: 130 }}>
                        {exporting === 'excel'
                          ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Exporting...</>
                          : <><Download size={14} /> Export Excel</>}
                      </button>
                      <button className="btn btn-outline-gray" onClick={exportCSV} disabled={!!exporting} style={{ minWidth: 110 }}>
                        {exporting === 'csv'
                          ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Exporting...</>
                          : <><FileText size={14} /> Export CSV</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stat cards — show after generate */}
          {data && (
            <div className="stats-grid">
              {[
                { label: 'Total Students', value: students, color: 'blue',   icon: <Users size={26} /> },
                { label: 'Present',        value: present,  color: 'green',  icon: <CheckCircle size={26} /> },
                { label: 'Absent',         value: absent,   color: 'red',    icon: <XCircle size={26} /> },
                { label: 'Attendance %',   value: `${pct}%`,color: 'purple', icon: <PieChart size={26} /> },
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
          )}
        </div>
      </div>

      {/* ── Pie chart ── */}
      {data && present + absent > 0 && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">
              {REPORT_TYPES.find(t => t.id === type)?.label} — {dateLabel()}
            </span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {present} present out of {students} students ({pct}%)
            </span>
          </div>
          <div className="card-body" style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  innerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelLine={true}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend />
              </RPie>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── No data message ── */}
      {data && present + absent === 0 && (
        <div className="card">
          <div className="card-body text-center" style={{ padding: 60 }}>
            <BarChart3 size={48} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#9ca3af', fontSize: 15, fontWeight: 500 }}>No attendance data found</p>
            <p style={{ color: '#d1d5db', fontSize: 13, marginTop: 6 }}>
              No attendance records exist for this {type === 'monthly' ? 'month' : 'date'}.<br />
              Take attendance first using the <strong>Take Attendance</strong> page.
            </p>
          </div>
        </div>
      )}

      {/* ── Initial prompt ── */}
      {!data && !loading && (
        <div className="card">
          <div className="card-body text-center" style={{ padding: 60 }}>
            <BarChart3 size={48} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#9ca3af', fontSize: 15, fontWeight: 500 }}>Select a report type and date, then click Generate</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {REPORT_TYPES.map(t => (
                <div
                  key={t.id}
                  onClick={() => setType(t.id)}
                  style={{
                    padding: '10px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    background: type === t.id ? '#2563eb' : '#f3f4f6',
                    color: type === t.id ? '#fff' : '#374151',
                    fontWeight: 500, transition: 'all 0.2s',
                  }}
                >{t.label}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
