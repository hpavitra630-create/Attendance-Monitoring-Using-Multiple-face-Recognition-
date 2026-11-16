/**
 * Student Detail Page — /students/:studentId
 * PRD §21, WORKFLOW §21, MASTER_PROMPT §12
 *
 * Shows:
 *  - Student profile info (including USN)
 *  - Total sessions / Present / Absent / Attendance %
 *  - Full date-wise attendance history
 *  - Manual correction button on each record
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Hash, BookOpen, Phone, Mail, MapPin,
  CheckCircle, XCircle, AlertCircle, Calendar, Clock,
  Edit3, ChevronRight, Percent, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

/* ── Attendance % ring ───────────────────────────────────────────────── */
function AttendanceRing({ percentage }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percentage / 100);
  const color = percentage >= 75 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '55px 55px', transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="55" y="52" textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="700">
        {percentage.toFixed(1)}%
      </text>
      <text x="55" y="68" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">
        attendance
      </text>
    </svg>
  );
}

/* ── Correction modal ───────────────────────────────────────────────── */
function CorrectionModal({ record, onClose, onSave }) {
  const [newStatus, setNewStatus] = useState(record.status);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Reason is required.'); return; }
    setLoading(true);
    try {
      const res = await api.put(`/attendance/${record.id}`, { new_status: newStatus, reason });
      toast.success(res.data?.message || 'Attendance corrected.');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Failed to correct attendance.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: 32,
        width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
      }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Correct Attendance</h3>
        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
          Record: {record.date} · {record.time} · Current: <strong>{record.status}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
            New Status
          </label>
          <select
            value={newStatus} onChange={e => setNewStatus(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, marginBottom: 16,
              border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)',
              fontSize: 14
            }}
          >
            {['Present', 'Absent', 'Late', 'Excused'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
            Reason <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Enter reason for correction (required)..."
            required
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, marginBottom: 20,
              border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)',
              fontSize: 13, resize: 'vertical', boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer'
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 600
            }}>
              {loading ? 'Saving…' : 'Save Correction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────── */
export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [correcting, setCorrecting] = useState(null); // record being corrected

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${studentId}/attendance`);
      setStudent(res.data.data.student);
      setSummary(res.data.data.summary);
      setRecords(res.data.data.records);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Failed to load student data.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const statusIcon = (s) => {
    if (s === 'Present') return <CheckCircle size={15} color="#22c55e" />;
    if (s === 'Absent') return <XCircle size={15} color="#ef4444" />;
    if (s === 'Late') return <AlertCircle size={15} color="#f59e0b" />;
    return <AlertCircle size={15} color="#8b5cf6" />;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div className="spinner" />
    </div>
  );

  if (!student) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <p style={{ color: 'var(--text-secondary)' }}>Student not found.</p>
      <button onClick={() => navigate('/students')} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>← Back</button>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate('/students')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13
        }}>
          <ArrowLeft size={15} /> Back
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          Student Detail
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={load} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            borderRadius: 8, border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => navigate(`/students/register/${studentId}`)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: 'none', background: 'var(--primary)',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600
          }}>
            <Edit3 size={14} /> Edit Student
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Profile card */}
        <div style={{
          background: 'var(--surface)', borderRadius: 16, padding: 24,
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'var(--primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0
            }}>
              <User size={28} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {student.name}
              </h2>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, padding: '2px 8px', borderRadius: 20,
                background: student.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: student.is_active ? '#22c55e' : '#ef4444', marginTop: 4
              }}>
                {student.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {[
            { icon: Hash, label: 'Student ID', value: student.student_id },
            { icon: BookOpen, label: 'USN', value: student.usn || '—' },
            { icon: BookOpen, label: 'Department', value: student.department },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Icon size={16} color="var(--text-secondary)" />
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, minWidth: 90 }}>{label}</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Attendance summary card */}
        {summary && (
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 24,
            border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20
          }}>
            <AttendanceRing percentage={summary.attendance_percentage} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, width: '100%' }}>
              {[
                { label: 'Total', value: summary.total_sessions, color: 'var(--text-primary)' },
                { label: 'Present', value: summary.present, color: '#22c55e' },
                { label: 'Absent', value: summary.absent, color: '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance history table */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} color="var(--text-secondary)" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Attendance History ({records.length} records)
          </h3>
        </div>

        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            No attendance records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Date', 'Time', 'Status', 'Method', 'Confidence', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id} style={{
                    borderTop: '1px solid var(--border)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                  }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                      {r.date}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {r.time}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {statusIcon(r.status)}
                        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{r.status}</span>
                      </span>
                      {r.recognition_method === 'image_upload' && (
                        <span title="Marked via uploaded image � verify for possible spoofing"
                          style={{ marginLeft: 6, display: 'inline-block', background: '#f59e0b', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, verticalAlign: 'middle' }}>
                          ?? Upload
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {r.recognition_method || 'face_recognition'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {r.confidence != null ? `${r.confidence.toFixed(1)}%` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => setCorrecting(r)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '5px 10px', borderRadius: 6, fontSize: 12,
                          border: '1px solid var(--border)', background: 'transparent',
                          color: 'var(--text-secondary)', cursor: 'pointer'
                        }}
                      >
                        <Edit3 size={12} /> Correct
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Correction modal */}
      {correcting && (
        <CorrectionModal
          record={correcting}
          onClose={() => setCorrecting(null)}
          onSave={() => { setCorrecting(null); load(); }}
        />
      )}
    </div>
  );
}
