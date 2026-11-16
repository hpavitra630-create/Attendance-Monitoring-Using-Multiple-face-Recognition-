import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Users, Camera, Scan, ClipboardList,
  BookOpen, BarChart3, Settings, LogOut, CalendarClock, ShieldCheck
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',          label: 'Dashboard',          icon: <LayoutDashboard size={17} /> },
  { to: '/students',           label: 'Students',           icon: <Users size={17} />           },
  { to: '/face-registration',  label: 'Face Registration',  icon: <Camera size={17} />          },
  { to: '/attendance',         label: 'Take Attendance',    icon: <Scan size={17} />            },
  { to: '/attendance-sessions',label: 'Class Sessions',      icon: <CalendarClock size={17} />   },
  { to: '/attendance-records', label: 'Attendance Records', icon: <ClipboardList size={17} />   },
  { to: '/subjects',           label: 'Subjects',           icon: <BookOpen size={17} />        },
  { to: '/reports',            label: 'Reports',            icon: <BarChart3 size={17} />       },
  { to: '/settings',           label: 'Settings',           icon: <Settings size={17} />        },
  { to: '/audit-logs',         label: 'Audit Logs',         icon: <ShieldCheck size={17} />     },
];

/* Shield + face scan SVG matching the reference logo */
function ShieldFaceIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M32 4L8 14v18c0 13 10.5 24 24 28 13.5-4 24-15 24-28V14L32 4z"
        fill="#2563eb" opacity="0.9"/>
      <path d="M32 4L8 14v18c0 13 10.5 24 24 28 13.5-4 24-15 24-28V14L32 4z"
        fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
      {/* face scan lines */}
      <rect x="20" y="20" width="8" height="2" rx="1" fill="white" opacity="0.85"/>
      <rect x="36" y="20" width="8" height="2" rx="1" fill="white" opacity="0.85"/>
      <rect x="20" y="20" width="2" height="8" rx="1" fill="white" opacity="0.85"/>
      <rect x="42" y="20" width="2" height="8" rx="1" fill="white" opacity="0.85"/>
      <rect x="20" y="42" width="8" height="2" rx="1" fill="white" opacity="0.85"/>
      <rect x="36" y="42" width="8" height="2" rx="1" fill="white" opacity="0.85"/>
      <rect x="20" y="36" width="2" height="6" rx="1" fill="white" opacity="0.85"/>
      <rect x="42" y="36" width="2" height="6" rx="1" fill="white" opacity="0.85"/>
      {/* face dots */}
      <circle cx="27" cy="30" r="2.5" fill="white" opacity="0.9"/>
      <circle cx="37" cy="30" r="2.5" fill="white" opacity="0.9"/>
      <path d="M27 37 Q32 41 37 37" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9"/>
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldFaceIcon />
        </div>
        <div className="sidebar-logo-title">Attendance Monitoring</div>
        <div className="sidebar-logo-subtitle">Using Face Recognition<br />for Students</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-bottom">
        <button onClick={handleLogout} className="nav-item" style={{ color: '#ef4444' }}>
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  );
}
