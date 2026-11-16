import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle, XCircle, PieChart, UserPlus, Camera, Video, BarChart3 } from 'lucide-react';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const [trend, setTrend]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [s, r, t] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-attendance'),
        api.get('/dashboard/weekly-trend'),
      ]);
      setStats(s.data.data);
      setRecent(r.data.data || []);
      setTrend(t.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  const cards = [
    { label: 'Total Students', value: stats?.total_students ?? 0,                        color: 'blue',   icon: <Users size={26} />,        to: '/students' },
    { label: 'Present Today',  value: stats?.present_today ?? 0,                         color: 'green',  icon: <CheckCircle size={26} />,  to: '/attendance-records?status=Present' },
    { label: 'Absent Today',   value: stats?.absent_today ?? 0,                          color: 'red',    icon: <XCircle size={26} />,      to: '/attendance-records?status=Absent' },
    { label: 'Attendance %',   value: `${(stats?.attendance_percentage ?? 0).toFixed(2)}%`, color: 'purple', icon: <PieChart size={26} />, to: '/reports' },
  ];

  const quickActions = [
    { to: '/students/register',  label: 'Register Student', icon: <UserPlus size={20} />,  color: 'blue'   },
    { to: '/face-registration',  label: 'Capture Face',     icon: <Camera size={20} />,    color: 'green'  },
    { to: '/attendance',         label: 'Take Attendance',  icon: <Video size={20} />,     color: 'orange' },
    { to: '/reports',            label: 'Generate Report',  icon: <BarChart3 size={20} />, color: 'purple' },
  ];

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  const dayStr  = now.toLocaleDateString('en-IN', { weekday:'long' });

  return (
    <div>
      {/* Title row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h1 className="page-title">Dashboard</h1>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 14px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize:13, fontWeight:600 }}>{dateStr}</span>
          <span style={{ fontSize:12, color:'#6b7280' }}>{dayStr}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="stat-card" style={{ textDecoration: 'none' }}>
            <div className={`stat-icon ${c.color}`}>{c.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{c.label}</div>
              <div className={`stat-value ${c.color}`}>{c.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom: recent attendance + quick actions */}
      <div className="dashboard-grid">
        {/* Recent Attendance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Attendance</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No attendance records yet.</td></tr>
                ) : recent.slice(0, 8).map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.student_id}</td>
                    <td>{r.student_name}</td>
                    <td style={{ color: '#6b7280' }}>{r.department || '—'}</td>
                    <td style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {r.time_in ? new Date(r.time_in).toLocaleTimeString('en-IN') : (r.time || r.date)}
                    </td>
                    <td>
                      <span className={r.status === 'Present' ? 'status-present' : 'status-absent'}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Quick Actions</span>
          </div>
          <div className="card-body quick-actions-list">
            {quickActions.map(a => (
              <Link key={a.to} to={a.to} className={`quick-action-btn ${a.color}`}>
                {a.icon}
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Attendance Trend */}
      {trend.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">7-Day Attendance Trend</span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Last 7 days</span>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent"  name="Absent"  fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
