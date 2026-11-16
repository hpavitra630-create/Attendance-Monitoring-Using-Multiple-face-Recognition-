import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, Eye, EyeOff, Shield, ShieldCheck, Clock, BarChart2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid username or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async () => {
    setUsername('admin'); setPassword('admin123');
    setLoading(true);
    try {
      await login('admin', 'admin123');
      navigate('/dashboard');
    } catch {
      setError('Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      {/* ── Left panel: dark blue ── */}
      <div className="login-left">
        <div style={{ position: 'relative', zIndex: 1, width: '100%', textAlign: 'center' }}>
          {/* Face scan icon */}
          <div style={{ marginBottom: 20 }}>
            <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ margin: '0 auto', display: 'block' }}>
              {/* Corner brackets */}
              <rect x="12" y="12" width="18" height="3" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="12" y="12" width="3" height="18" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="60" y="12" width="18" height="3" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="75" y="12" width="3" height="18" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="12" y="75" width="18" height="3" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="12" y="60" width="3" height="18" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="60" y="75" width="18" height="3" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="75" y="60" width="3" height="18" rx="1.5" fill="white" opacity="0.9"/>
              {/* Face */}
              <circle cx="35" cy="38" r="5" fill="white" opacity="0.9"/>
              <circle cx="55" cy="38" r="5" fill="white" opacity="0.9"/>
              <path d="M32 55 Q45 64 58 55" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            Attendance Monitoring
          </h1>
          <p style={{ fontSize: 14, color: '#60a5fa', fontWeight: 600, marginBottom: 6 }}>
            Using Face Recognition for Students
          </p>
          <div style={{ width: 40, height: 3, background: '#3b82f6', borderRadius: 2, margin: '0 auto 20px' }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto' }}>
            A smart and secure way to monitor student attendance using advanced face recognition technology.
          </p>
        </div>

        {/* Face wireframe image area */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            width: 220, height: 220,
            borderRadius: 16,
            border: '2px solid rgba(96,165,250,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(37,99,235,0.15)',
          }}>
            <svg width="140" height="160" viewBox="0 0 140 160" fill="none" opacity="0.85">
              <ellipse cx="70" cy="70" rx="45" ry="55" stroke="#60a5fa" strokeWidth="1.5" fill="none"/>
              <line x1="25" y1="70" x2="0" y2="70" stroke="#60a5fa" strokeWidth="1" opacity="0.5"/>
              <line x1="115" y1="70" x2="140" y2="70" stroke="#60a5fa" strokeWidth="1" opacity="0.5"/>
              <circle cx="53" cy="60" r="6" stroke="#93c5fd" strokeWidth="1.5" fill="none"/>
              <circle cx="87" cy="60" r="6" stroke="#93c5fd" strokeWidth="1.5" fill="none"/>
              <path d="M57 85 Q70 95 83 85" stroke="#93c5fd" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <line x1="70" y1="45" x2="70" y2="35" stroke="#60a5fa" strokeWidth="1" opacity="0.6"/>
              <path d="M30 120 Q70 155 110 120" stroke="#60a5fa" strokeWidth="1.5" fill="none" opacity="0.5"/>
              {/* Grid lines */}
              {[50,60,70,80,90].map(y => (
                <line key={y} x1="25" y1={y} x2="115" y2={y} stroke="#1d4ed8" strokeWidth="0.5" opacity="0.3"/>
              ))}
              {[40,55,70,85,100].map(x => (
                <line key={x} x1={x} y1="15" x2={x} y2="125" stroke="#1d4ed8" strokeWidth="0.5" opacity="0.3"/>
              ))}
            </svg>
          </div>
        </div>

        {/* 3 feature icons */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 28, justifyContent: 'center', width: '100%' }}>
          {[
            { Icon: ShieldCheck, color: '#60a5fa', label: 'Secure', sub: 'Advanced security\nand data protection' },
            { Icon: Clock,       color: '#a855f7', label: 'Real-time', sub: 'Real-time attendance\ntracking' },
            { Icon: BarChart2,   color: '#34d399', label: 'Analytics', sub: 'Detailed reports and\nanalytics' },
          ].map(({ Icon, color, label, sub }) => (
            <div key={label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 22,
                border: `2px solid ${color}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 8px',
              }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
          © 2025 Attendance Monitoring System. All rights reserved.
        </div>
      </div>

      {/* ── Right panel: white ── */}
      <div className="login-right">
        <div className="login-card">
          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#eff6ff', border: '2px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={36} color="#2563eb" />
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', color: '#111827', marginBottom: 6 }}>
            Welcome Back!
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 28 }}>
            Login to your account to continue
          </p>

          {error && (
            <div className="alert alert-danger mb-3">
              <Lock size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Username */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  id="login-username"
                  type="text"
                  className="form-control"
                  placeholder="Enter your username"
                  style={{ paddingLeft: 36 }}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  style={{ paddingLeft: 36, paddingRight: 36 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 2 }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex justify-between items-center">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ accentColor: '#2563eb', width: 14, height: 14 }} />
                Remember me
              </label>
              <button type="button" style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Forgot Password?
              </button>
            </div>

            {/* Login button */}
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ justifyContent: 'center', fontSize: 14, padding: '11px 0', borderRadius: 8 }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Logging in...</>
              ) : (
                <><LogIn size={16} /> Login</>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ fontSize: 11, color: '#9ca3af' }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            {/* Admin login button */}
            <button
              type="button"
              onClick={quickLogin}
              disabled={loading}
              className="btn btn-outline-gray w-full"
              style={{ justifyContent: 'center', fontSize: 13, padding: '10px 0' }}
            >
              <Shield size={15} color="#1f2937" /> Login with Admin Account
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20 }}>
            Don't have an account?{' '}
            <span style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>Contact Administrator</span>
          </p>
        </div>
      </div>
    </div>
  );
}
