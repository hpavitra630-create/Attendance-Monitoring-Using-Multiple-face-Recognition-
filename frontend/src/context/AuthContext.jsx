/**
 * AuthContext.jsx
 * Dedicated React Context for authentication state management.
 * Defined in TRD Section 2.2 Component Architecture as context/AuthContext.jsx
 *
 * Provides: { user, loading, login, logout, changePassword }
 * Re-exported from hooks/useAuth.jsx for backward compatibility.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    const token    = localStorage.getItem('access_token');
    const userInfo = localStorage.getItem('user_info');
    if (token && userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
      }
    }
    setLoading(false);
  }, []);

  /** Log in with username + password. Returns the full API response. */
  const login = useCallback(async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { access_token, username: uname, full_name } = response.data;
    localStorage.setItem('access_token', access_token);
    const userInfo = { username: uname, full_name };
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    setUser(userInfo);
    return response.data;
  }, []);

  /** Clear session and redirect to login. */
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    setUser(null);
  }, []);

  /**
   * Change the current admin's password.
   * Calls PATCH /api/auth/change-password with { old_password, new_password }.
   * Returns { success, message }.
   */
  const changePassword = useCallback(async (oldPassword, newPassword) => {
    const response = await api.patch('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  }, []);

  const value = { user, loading, login, logout, changePassword };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth — consume the AuthContext inside any component.
 * Must be used within an <AuthProvider> tree.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used inside an <AuthProvider>.');
  }
  return ctx;
}
