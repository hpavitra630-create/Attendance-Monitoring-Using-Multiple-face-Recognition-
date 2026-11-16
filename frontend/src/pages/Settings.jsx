import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Upload, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const THRESHOLDS  = ['50','55','60','65','70','75','80','85','90'];
const CAMERAS     = ['0','1','2','3'];
const RESOLUTIONS = ['640 x 480','1280 x 720','1920 x 1080'];
const THEMES      = ['Dark','Light'];

export default function Settings() {
  const [form, setForm] = useState({
    app_name: 'Attendance Monitoring System',
    recognition_threshold: '70',
    camera_index: '0',
    camera_resolution: '640 x 480',
    theme: 'Dark',
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [backupFile, setBackupFile] = useState(null);
  const [lastBackup, setLastBackup] = useState(null);
  const [serverBackups, setServerBackups] = useState([]);  // list of available server-side backups
  const [selectedBackup, setSelectedBackup] = useState(''); // selected server backup path
  // Change password form
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => { loadSettings(); loadServerBackups(); }, []);

  const loadServerBackups = async () => {
    try {
      const res = await api.get('/settings/backups');
      setServerBackups(res.data.data || []);
    } catch { setServerBackups([]); }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      const s = res.data.data || res.data;
      const theme = s.theme ? s.theme.charAt(0).toUpperCase() + s.theme.slice(1) : 'Dark';
      setForm({
        app_name:               s.app_name || 'Attendance Monitoring System',
        recognition_threshold:  String(Math.round((s.recognition_threshold || 0.7) * 100)),
        camera_index:           String(s.camera_index ?? 0),
        camera_resolution:      s.camera_resolution?.replace('x', ' x ') || '640 x 480',
        theme,
      });
      // Apply saved theme on load
      applyTheme(theme);
    } catch {}
    finally { setLoading(false); }
  };

  /** Write data-theme attribute to <body> so CSS variables take effect immediately. */
  const applyTheme = (theme) => {
    document.body.setAttribute('data-theme', theme.toLowerCase());
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings', {
        app_name:               form.app_name,
        recognition_threshold:  parseFloat(form.recognition_threshold) / 100,
        camera_index:           parseInt(form.camera_index),
        camera_resolution:      form.camera_resolution.replace(' x ', 'x'),
        theme:                  form.theme.toLowerCase(),
      });
      // Apply theme immediately on save
      applyTheme(form.theme);
      toast.success('Settings saved!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const backupNow = async () => {
    try {
      const res = await api.post('/settings/backup');
      setLastBackup(new Date().toLocaleString('en-IN'));
      toast.success(res.data.message || 'Backup created!');
      loadServerBackups(); // refresh list after new backup
    } catch { toast.error('Backup failed'); }
  };

  const restoreDB = async () => {
    if (!selectedBackup) { toast.error('Select a server backup to restore'); return; }
    if (!window.confirm('⚠️ This will OVERWRITE the current database. Are you sure?')) return;
    try {
      await api.post('/settings/restore', { backup_path: selectedBackup });
      toast.success('Database restored! Please restart the server.');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Restore failed');
    }
  };

  const changePassword = async () => {
    if (!pwForm.old_password || !pwForm.new_password) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    try {
      await api.patch('/auth/change-password', {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed successfully!');
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Password change failed');
    } finally { setPwSaving(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setPw = (k) => (e) => setPwForm(f => ({ ...f, [k]: e.target.value }));

  if (loading) return <div className="loading-overlay"><div className="spinner"/></div>;

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom:20 }}>Settings</h1>
      <div className="settings-grid">
        {/* Application Settings */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <SettingsIcon size={18} color="#2563eb"/>
              <span className="card-title">Application Settings</span>
            </div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Application Name</label>
              <input className="form-control" value={form.app_name} onChange={set('app_name')}/>
            </div>
            <div className="form-group">
              <label className="form-label">Recognition Threshold (%)</label>
              <select className="form-control" value={form.recognition_threshold} onChange={set('recognition_threshold')}>
                {THRESHOLDS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Camera Index</label>
              <select className="form-control" value={form.camera_index} onChange={set('camera_index')}>
                {CAMERAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Camera Resolution</label>
              <select className="form-control" value={form.camera_resolution} onChange={set('camera_resolution')}>
                {RESOLUTIONS.map(r => <option key={r}>{r}</option>)}
              </select>
              <small style={{ color:'#6b7280', fontSize:11, marginTop:4, display:'block' }}>
                Applied next time you start the camera
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">Theme</label>
              <select className="form-control" value={form.theme} onChange={set('theme')}>
                {THEMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button className="btn btn-success w-full" style={{ justifyContent:'center', marginTop:8 }} onClick={saveSettings} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width:14,height:14,borderWidth:2,borderTopColor:'#fff',borderColor:'rgba(255,255,255,0.3)'}}/> Saving...</> : <><Save size={15}/> Save Settings</>}
            </button>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Backup */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Database size={18} color="#7c3aed"/>
                <span className="card-title">Database Backup</span>
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize:12, color:'#6b7280', marginBottom:16 }}>Backup includes database + all face encodings</p>
              {lastBackup && (
                <div style={{ marginBottom:12, fontSize:13 }}>
                  <div className="flex justify-between mb-2">
                    <span style={{ color:'#6b7280' }}>Last Backup</span>
                    <span style={{ fontWeight:600 }}>{lastBackup}</span>
                  </div>
                </div>
              )}
              <button className="btn btn-primary w-full" style={{ justifyContent:'center' }} onClick={backupNow}>
                <Database size={15}/> Backup Now
              </button>
            </div>
          </div>

          {/* Restore */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Upload size={18} color="#ea580c"/>
                <span className="card-title">Database Restore</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#9a3412', display: 'flex', gap: 8 }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Only backups created by this server can be restored. Restoring will overwrite the current database — restart the server afterwards.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Select Server Backup</label>
                <select
                  className="form-control"
                  value={selectedBackup}
                  onChange={e => setSelectedBackup(e.target.value)}
                >
                  <option value="">— Choose a backup —</option>
                  {serverBackups.map(b => (
                    <option key={b.path} value={b.path}>
                      {b.filename} {b.created_at ? `(${new Date(b.created_at).toLocaleString('en-IN')})` : ''}
                    </option>
                  ))}
                </select>
                {serverBackups.length === 0 && (
                  <small style={{ color: '#6b7280', fontSize: 11, marginTop: 4, display: 'block' }}>
                    No backups found. Click "Backup Now" to create one first.
                  </small>
                )}
              </div>
              <button className="btn btn-warning w-full" style={{ justifyContent: 'center' }} onClick={restoreDB} disabled={!selectedBackup}>
                <Upload size={15}/> Restore Selected Backup
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} color="#16a34a"/>
                <span className="card-title">Change Password</span>
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize:12, color:'#6b7280', marginBottom:16 }}>Update your admin login password</p>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-control" placeholder="Enter current password"
                  value={pwForm.old_password} onChange={setPw('old_password')} autoComplete="current-password"/>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" placeholder="Min. 6 characters"
                  value={pwForm.new_password} onChange={setPw('new_password')} autoComplete="new-password"/>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-control" placeholder="Re-enter new password"
                  value={pwForm.confirm_password} onChange={setPw('confirm_password')} autoComplete="new-password"/>
              </div>
              <button className="btn btn-success w-full" style={{ justifyContent:'center' }} onClick={changePassword} disabled={pwSaving}>
                {pwSaving
                  ? <><div className="spinner" style={{ width:14,height:14,borderWidth:2,borderTopColor:'#fff',borderColor:'rgba(255,255,255,0.3)'}}/> Saving...</>
                  : <><CheckCircle size={15}/> Change Password</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
