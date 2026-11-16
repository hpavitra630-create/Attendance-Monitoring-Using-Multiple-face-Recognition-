import { useState, useEffect } from 'react';
import { FileText, Download, User, Calendar, BarChart2, Printer } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => String(currentYear - 1 + i));

export default function StudentReport() {
  const today = new Date();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [studentInfo, setStudentInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await api.get('/students', { params: { limit: 200 } });
      setStudents(res.data.data || []);
      if (res.data.data?.length > 0) setSelectedStudent(res.data.data[0].student_id);
    } catch { /* silent */ }
  };

  const handleGenerate = async () => {
    if (!selectedStudent) { toast.error('Please select a student.'); return; }
    setLoading(true);
    try {
      const [studentRes, reportRes] = await Promise.all([
        api.get(`/students/${selectedStudent}`),
        api.get(`/reports/student/${selectedStudent}`, { params: { month, year } }),
      ]);
      setStudentInfo(studentRes.data.data);
      setStats(reportRes.data.data.stats);
      setRecords(reportRes.data.data.records || []);
      setGenerated(true);
    } catch {
      toast.error('Failed to generate student report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      toast.loading(`Exporting ${format.toUpperCase()}...`, { id: 'export' });
      const res = await api.get(`/reports/export/${format}`, {
        params: { student_id: selectedStudent },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_${selectedStudent}_report.${format === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} exported!`, { id: 'export' });
    } catch { toast.error('Export failed.', { id: 'export' }); }
  };

  return (
    <div>
      {/* Controls */}
      <div className="filter-bar mb-4">
        <div className="filter-group" style={{ flex: 1 }}>
          <label className="filter-label">Select Student</label>
          <select className="form-control" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
            <option value="">Choose a student...</option>
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.student_id} — {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Month</label>
          <select className="form-control" value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Year</label>
          <select className="form-control" value={year} onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2" style={{ paddingTop: 16 }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generating...</> : <><BarChart2 size={14} /> Generate</>}
          </button>
        </div>
      </div>

      {generated && studentInfo && (
        <div className="flex flex-col gap-4">
          {/* Student Info + Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Student Info Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Student Information</h3>
              </div>
              <div className="card-body">
                <div className="flex items-center gap-4 mb-4">
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '24px', fontWeight: 700, flexShrink: 0
                  }}>
                    {studentInfo.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{studentInfo.name}</div>
                    <div className="text-secondary text-sm">{studentInfo.student_id}</div>
                    <span className="badge badge-info mt-1">{studentInfo.department}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    ['Student ID', studentInfo.student_id],
                    ['Name', studentInfo.name],
                    ['Department', studentInfo.department],
                    ['Course', studentInfo.course],
                    ['Semester', studentInfo.semester || '—'],
                    ['Section', studentInfo.section || '—'],
                    ['Email', studentInfo.email || '—'],
                    ['Phone', studentInfo.phone || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center" style={{
                      fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #f1f5f9'
                    }}>
                      <span className="text-secondary">{label}</span>
                      <span className="text-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  Attendance Statistics — {MONTHS.find(m => m.value === month)?.label} {year}
                </h3>
              </div>
              <div className="card-body">
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Total Classes', value: stats?.total_classes || 0, color: 'blue' },
                    { label: 'Present', value: stats?.present || 0, color: 'green' },
                    { label: 'Absent', value: stats?.absent || 0, color: 'red' },
                    { label: 'Attendance %', value: `${(stats?.attendance_percentage || 0).toFixed(1)}%`, color: 'purple' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card" style={{ padding: '14px 16px' }}>
                      <div className={`stat-icon ${color}`} style={{ width: 40, height: 40 }}>
                        <BarChart2 size={18} />
                      </div>
                      <div className="stat-info">
                        <div className="stat-value" style={{ fontSize: '22px' }}>{value}</div>
                        <div className="stat-label">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="card no-print">
            <div className="card-header">
              <h3 className="card-title">Attendance Records</h3>
              <div className="flex gap-2">
                <button className="btn btn-success btn-sm" onClick={() => handleExport('excel')}>
                  <Download size={13} /> Excel
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => handleExport('csv')}>
                  <Download size={13} /> CSV
                </button>
                <button className="btn btn-outline-gray btn-sm" onClick={() => window.print()}>
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Time</th>
                    <th>Confidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted" style={{ padding: '32px' }}>
                        No attendance records found for this period.
                      </td>
                    </tr>
                  ) : (
                    records.map((r, i) => (
                      <tr key={r.id}>
                        <td className="text-muted">{i + 1}</td>
                        <td className="text-bold">{r.date}</td>
                        <td className="text-secondary">{r.subject_name || 'N/A'}</td>
                        <td className="text-secondary">{r.time}</td>
                        <td>
                          {r.confidence ? (
                            <span style={{
                              color: r.confidence >= 85 ? '#16a34a' : r.confidence >= 70 ? '#d97706' : '#dc2626',
                              fontWeight: 600, fontSize: '12px'
                            }}>
                              {r.confidence.toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <span className={`badge ${r.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!generated && (
        <div className="card">
          <div className="loading-overlay" style={{ height: '300px' }}>
            <FileText size={48} color="#cbd5e1" />
            <span className="text-muted">Select a student and click "Generate" to view the report.</span>
          </div>
        </div>
      )}
    </div>
  );
}
