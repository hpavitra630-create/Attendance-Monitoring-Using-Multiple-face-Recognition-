import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Menu, Calendar, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const PAGE_TITLES = {
  '/dashboard':          'Dashboard',
  '/students':           'Students',
  '/students/register':  'Student Registration',
  '/face-registration':  'Face Registration',
  '/attendance':         'Take Attendance',
  '/attendance-records': 'Attendance Records',
  '/subjects':           'Subjects',
  '/reports':            'Reports',
  '/settings':           'Settings',
};

function getTitle(pathname) {
  if (pathname.startsWith('/students/register')) return 'Student Registration';
  return PAGE_TITLES[pathname] || 'Dashboard';
}

export default function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const title = getTitle(location.pathname);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const dayStr  = now.toLocaleDateString('en-IN', { weekday: 'long' });

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {/* Dark top header */}
        <div className="page-header">
          <button className="page-header-menu">
            <Menu size={20} />
          </button>

          <div className="page-header-right">
            <div className="date-badge-icon">
              <Calendar size={16} color="rgba(255,255,255,0.5)" />
              <div className="date-badge">
                <span className="date-badge-main">{dateStr}</span>
                <span className="date-badge-sub">{dayStr}</span>
              </div>
            </div>

            <div className="avatar-btn">
              <div className="avatar-circle">
                {user?.full_name?.[0] || 'A'}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                {user?.username || 'admin'}
              </span>
              <ChevronDown size={13} color="rgba(255,255,255,0.5)" />
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
