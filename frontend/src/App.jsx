import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import StudentRegister from './pages/StudentRegister';
import FaceRegistration from './pages/FaceRegistration';
import TakeAttendance from './pages/TakeAttendance';
import AttendanceRecords from './pages/AttendanceRecords';
import Subjects from './pages/Subjects';
import Reports from './pages/Reports';
import StudentReport from './pages/StudentReport';
import Settings from './pages/Settings';
import AttendanceSessions from './pages/AttendanceSessions';
import AuditLogs from './pages/AuditLogs';

function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <span style={{ fontSize: 64 }}>🔍</span>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Page Not Found</h2>
      <p style={{ color: '#6b7280', fontSize: 14 }}>The page you're looking for doesn't exist.</p>
      <a href="/dashboard" style={{ color: '#2563eb', fontSize: 14, fontWeight: 600 }}>← Back to Dashboard</a>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-overlay" style={{ height: '100vh' }}>
      <div className="spinner" />
      <span>Loading...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/register" element={<StudentRegister />} />
        <Route path="students/register/:studentId" element={<StudentRegister />} />
        <Route path="students/:studentId" element={<StudentDetail />} />
        <Route path="face-registration" element={<FaceRegistration />} />
        <Route path="attendance" element={<TakeAttendance />} />
        <Route path="attendance-sessions" element={<AttendanceSessions />} />
        <Route path="attendance-records" element={<AttendanceRecords />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/student" element={<StudentReport />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
